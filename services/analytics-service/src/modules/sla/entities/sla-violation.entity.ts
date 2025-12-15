import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { SLAViolationType } from '../enums/sla.enums';
import { SLAContract } from './sla-contract.entity';
import { SLARemedy } from './sla-remedy.entity';

/**
 * SLA Violation Entity
 * Records when an SLA contract is violated
 */
@Entity('sla_violations')
@Index(['contractId'])
@Index(['userId'])
@Index(['violationType'])
@Index(['detectedAt'])
export class SLAViolation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  contractId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({
    type: 'enum',
    enum: SLAViolationType,
  })
  violationType: SLAViolationType;

  // Violation Details
  @Column({ type: 'timestamp' })
  detectedAt: Date;

  @Column({ type: 'int' })
  guaranteedInterviews: number;

  @Column({ type: 'int' })
  actualInterviews: number;

  @Column({ type: 'int' })
  interviewsShortfall: number;

  @Column({ type: 'int', nullable: true })
  daysOverDeadline: number;

  // Contract State at Violation
  @Column({ type: 'int' })
  totalApplicationsSent: number;

  @Column({ type: 'int' })
  totalEmployerResponses: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  responseRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  interviewRate: number;

  // Root Cause Analysis
  @Column({ type: 'text', nullable: true })
  analysisNotes: string;

  @Column({ type: 'jsonb', nullable: true })
  rootCauseFactors: {
    lowApplicationVolume?: boolean;
    lowResponseRate?: boolean;
    profileIssues?: string[];
    marketConditions?: string[];
    userInactivity?: boolean;
    systemIssues?: string[];
  };

  // Escalation
  @Column({ type: 'boolean', default: false })
  isEscalated: boolean;

  @Column({ type: 'timestamp', nullable: true })
  escalatedAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  escalatedTo: string; // recruiter ID or team

  @Column({ type: 'varchar', length: 255, nullable: true })
  escalationTicketId: string;

  // Resolution
  @Column({ type: 'boolean', default: false })
  isResolved: boolean;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @Column({ type: 'text', nullable: true })
  resolutionNotes: string;

  // Notification
  @Column({ type: 'boolean', default: false })
  userNotified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  userNotifiedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  notificationDetails: {
    email?: boolean;
    sms?: boolean;
    inApp?: boolean;
    channels?: string[];
  };

  // Relations
  @ManyToOne(() => SLAContract, (contract) => contract.violations)
  @JoinColumn({ name: 'contractId' })
  contract: SLAContract;

  @OneToMany(() => SLARemedy, (remedy) => remedy.violation)
  remedies: SLARemedy[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper Methods
  getSeverity(): 'low' | 'medium' | 'high' | 'critical' {
    if (this.interviewsShortfall >= 5) return 'critical';
    if (this.interviewsShortfall >= 3) return 'high';
    if (this.interviewsShortfall >= 2) return 'medium';
    return 'low';
  }

  requiresHumanIntervention(): boolean {
    return (
      this.getSeverity() === 'high' ||
      this.getSeverity() === 'critical' ||
      this.daysOverDeadline > 7
    );
  }

  getRecommendedRemedies(): string[] {
    const remedies: string[] = [];

    if (this.interviewsShortfall <= 2) {
      remedies.push('service_extension');
    }

    if (this.interviewsShortfall > 2 || this.daysOverDeadline > 7) {
      remedies.push('human_recruiter_escalation');
    }

    if (this.responseRate < 5) {
      remedies.push('service_credit');
    }

    if (this.interviewsShortfall >= this.guaranteedInterviews / 2) {
      remedies.push('partial_refund');
    }

    if (this.totalApplicationsSent < 10) {
      remedies.push('service_extension');
    }

    return remedies;
  }
}
