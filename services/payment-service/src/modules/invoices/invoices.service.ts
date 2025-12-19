import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { Invoice } from './entities/invoice.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { LoggingService } from '../../common/logging/logging.service';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @Inject('PAYMENT_SERVICE')
    private paymentEventClient: ClientProxy,
    private loggingService: LoggingService,
  ) {}

  /**
   * Create a new invoice
   */
  async create(createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    try {
      this.logger.log(`Creating invoice: ${createInvoiceDto.stripeInvoiceId}`);

      const invoice = this.invoiceRepository.create(createInvoiceDto);
      const savedInvoice = await this.invoiceRepository.save(invoice);

      // Emit invoice created event
      this.emitInvoiceEvent('invoice.created', savedInvoice);

      this.logger.log(`Created invoice: ${savedInvoice.id}`);
      return savedInvoice;
    } catch (error) {
      this.logger.error(`Failed to create invoice: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create or update invoice (upsert based on stripeInvoiceId)
   */
  async createOrUpdate(createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    try {
      // Check if invoice already exists
      const existingInvoice = await this.findByStripeInvoiceId(createInvoiceDto.stripeInvoiceId);

      if (existingInvoice) {
        // Update existing invoice
        this.logger.log(`Updating existing invoice: ${existingInvoice.id}`);
        return await this.update(existingInvoice.id, createInvoiceDto);
      } else {
        // Create new invoice
        return await this.create(createInvoiceDto);
      }
    } catch (error) {
      this.logger.error(`Failed to create or update invoice: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find all invoices with pagination
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: Invoice[]; total: number; page: number; lastPage: number }> {
    const [data, total] = await this.invoiceRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['subscription'],
    });

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  /**
   * Find invoice by ID
   */
  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['subscription'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  /**
   * Find invoice by Stripe invoice ID
   */
  async findByStripeInvoiceId(stripeInvoiceId: string): Promise<Invoice | null> {
    return await this.invoiceRepository.findOne({
      where: { stripeInvoiceId },
      relations: ['subscription'],
    });
  }

  /**
   * Find invoices by subscription ID
   */
  async findBySubscriptionId(
    subscriptionId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: Invoice[]; total: number; page: number; lastPage: number }> {
    const [data, total] = await this.invoiceRepository.findAndCount({
      where: { subscriptionId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['subscription'],
    });

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  /**
   * Find invoices by Stripe customer ID
   */
  async findByStripeCustomerId(
    stripeCustomerId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: Invoice[]; total: number; page: number; lastPage: number }> {
    const [data, total] = await this.invoiceRepository.findAndCount({
      where: { stripeCustomerId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['subscription'],
    });

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  /**
   * Update invoice
   */
  async update(
    id: string,
    updateInvoiceDto: UpdateInvoiceDto | CreateInvoiceDto,
  ): Promise<Invoice> {
    try {
      const invoice = await this.findOne(id);

      const previousStatus = invoice.status;

      Object.assign(invoice, updateInvoiceDto);
      const updatedInvoice = await this.invoiceRepository.save(invoice);

      // Emit event if status changed
      if (previousStatus !== updatedInvoice.status) {
        this.emitInvoiceEvent('invoice.status.changed', {
          invoice: updatedInvoice,
          previousStatus,
          newStatus: updatedInvoice.status,
        });

        // Emit specific event for paid invoices
        if (updatedInvoice.isPaid()) {
          this.emitInvoiceEvent('invoice.paid', updatedInvoice);
        }
      }

      this.logger.log(`Updated invoice: ${id}`);
      return updatedInvoice;
    } catch (error) {
      this.logger.error(`Failed to update invoice: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mark invoice as paid
   */
  async markAsPaid(id: string): Promise<Invoice> {
    const invoice = await this.findOne(id);
    invoice.status = 'paid' as any;
    invoice.paidAt = new Date();

    const updatedInvoice = await this.invoiceRepository.save(invoice);

    // Emit invoice paid event
    this.emitInvoiceEvent('invoice.paid', updatedInvoice);

    this.logger.log(`Marked invoice as paid: ${id}`);
    return updatedInvoice;
  }

  /**
   * Mark invoice as void
   */
  async markAsVoid(id: string): Promise<Invoice> {
    const invoice = await this.findOne(id);
    invoice.status = 'void' as any;

    const updatedInvoice = await this.invoiceRepository.save(invoice);

    // Emit invoice voided event
    this.emitInvoiceEvent('invoice.voided', updatedInvoice);

    this.logger.log(`Marked invoice as void: ${id}`);
    return updatedInvoice;
  }

  /**
   * Get invoice statistics
   */
  async getStatistics(): Promise<{
    totalInvoices: number;
    paidInvoices: number;
    openInvoices: number;
    totalRevenue: number;
  }> {
    const totalInvoices = await this.invoiceRepository.count();
    const paidInvoices = await this.invoiceRepository.count({
      where: { status: 'paid' as any },
    });
    const openInvoices = await this.invoiceRepository.count({
      where: { status: 'open' as any },
    });

    const revenueResult = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.amount)', 'total')
      .where('invoice.status = :status', { status: 'paid' })
      .getRawOne();

    const totalRevenue = parseFloat(revenueResult?.total || '0');

    return {
      totalInvoices,
      paidInvoices,
      openInvoices,
      totalRevenue,
    };
  }

  /**
   * Remove invoice
   */
  async remove(id: string): Promise<void> {
    const invoice = await this.findOne(id);
    await this.invoiceRepository.remove(invoice);
    this.logger.log(`Removed invoice: ${id}`);
  }

  /**
   * Emit invoice event to message queue
   */
  private emitInvoiceEvent(event: string, data: any) {
    try {
      this.paymentEventClient.emit(event, data);
      this.loggingService.logEvent(event, data, 'InvoicesService');
    } catch (error) {
      this.logger.error(`Failed to emit event ${event}: ${error.message}`);
    }
  }
}
