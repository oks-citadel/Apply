import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';

import { Answer, QuestionCategory, AnswerType } from './entities/answer.entity';

import type { CreateAnswerDto, UpdateAnswerDto } from './dto/create-answer.dto';

export interface MatchedAnswer {
  answer: Answer;
  matchScore: number;
  matchType: 'exact' | 'pattern' | 'keyword' | 'ai_suggested';
}

@Injectable()
export class AnswerLibraryService {
  private readonly logger = new Logger(AnswerLibraryService.name);

  // Common question patterns and their categories
  private readonly questionPatterns: Map<QuestionCategory, RegExp[]> = new Map([
    [QuestionCategory.WORK_AUTHORIZATION, [
      /authorized\s*to\s*work/i,
      /work\s*authorization/i,
      /legally\s*(?:authorized|eligible|entitled)/i,
      /right\s*to\s*work/i,
      /require\s*(?:sponsorship|visa)/i,
      /visa\s*(?:status|sponsorship)/i,
      /citizenship/i,
      /green\s*card/i,
      /work\s*permit/i,
    ]],
    [QuestionCategory.AVAILABILITY, [
      /start\s*date/i,
      /when\s*(?:can|could)\s*you\s*start/i,
      /available\s*to\s*start/i,
      /availability/i,
      /notice\s*period/i,
      /earliest\s*(?:start|available)/i,
    ]],
    [QuestionCategory.SALARY, [
      /salary\s*(?:expectation|requirement|range)/i,
      /desired\s*(?:salary|compensation)/i,
      /expected\s*(?:salary|pay|compensation)/i,
      /compensation\s*(?:expectation|requirement)/i,
      /pay\s*(?:rate|expectation)/i,
      /hourly\s*rate/i,
    ]],
    [QuestionCategory.EXPERIENCE, [
      /years\s*of\s*experience/i,
      /how\s*(?:many|much)\s*(?:years|experience)/i,
      /experience\s*(?:with|in|level)/i,
      /proficiency\s*(?:level|in)/i,
      /expertise\s*(?:level|in)/i,
    ]],
    [QuestionCategory.EDUCATION, [
      /highest\s*(?:degree|education|level)/i,
      /education\s*(?:level|background)/i,
      /degree\s*(?:type|held)/i,
      /graduated\s*from/i,
      /major\s*(?:in|field)/i,
      /gpa/i,
    ]],
    [QuestionCategory.RELOCATION, [
      /(?:willing|able)\s*to\s*relocate/i,
      /relocation/i,
      /move\s*(?:to|for)/i,
      /commute/i,
      /travel\s*(?:requirement|percentage)/i,
    ]],
    [QuestionCategory.REMOTE_WORK, [
      /remote\s*(?:work|position)/i,
      /work\s*(?:from\s*home|remotely)/i,
      /hybrid\s*(?:work|schedule)/i,
      /on-?site/i,
      /in-?office/i,
    ]],
    [QuestionCategory.BACKGROUND_CHECK, [
      /background\s*check/i,
      /criminal\s*(?:record|history|background)/i,
      /drug\s*(?:test|screen)/i,
      /security\s*clearance/i,
    ]],
    [QuestionCategory.REFERRAL, [
      /referred\s*by/i,
      /how\s*(?:did\s*you|you)\s*(?:hear|find|learn)/i,
      /source\s*of\s*(?:application|referral)/i,
      /employee\s*referral/i,
    ]],
    [QuestionCategory.VETERAN_STATUS, [
      /veteran\s*(?:status|preference)/i,
      /military\s*(?:service|status)/i,
      /served\s*in\s*(?:the\s*)?(?:military|armed\s*forces)/i,
    ]],
    [QuestionCategory.DISABILITY, [
      /disability/i,
      /accommodation/i,
      /special\s*needs/i,
    ]],
    [QuestionCategory.DIVERSITY, [
      /gender/i,
      /race/i,
      /ethnicity/i,
      /demographic/i,
      /self-?identify/i,
      /equal\s*opportunity/i,
    ]],
  ]);

  constructor(
    @InjectRepository(Answer)
    private readonly answerRepository: Repository<Answer>,
  ) {}

  async create(userId: string, dto: CreateAnswerDto): Promise<Answer> {
    const answer = this.answerRepository.create({
      ...dto,
      user_id: userId,
    });
    return this.answerRepository.save(answer);
  }

  async bulkCreate(userId: string, dtos: CreateAnswerDto[]): Promise<Answer[]> {
    const answers = dtos.map(dto =>
      this.answerRepository.create({
        ...dto,
        user_id: userId,
      }),
    );
    return this.answerRepository.save(answers);
  }

  async findAll(userId: string): Promise<Answer[]> {
    return this.answerRepository.find({
      where: { user_id: userId, is_active: true },
      order: { category: 'ASC', usage_count: 'DESC' },
    });
  }

  async findByCategory(userId: string, category: QuestionCategory): Promise<Answer[]> {
    return this.answerRepository.find({
      where: { user_id: userId, category, is_active: true },
      order: { usage_count: 'DESC' },
    });
  }

  async findOne(userId: string, id: string): Promise<Answer> {
    const answer = await this.answerRepository.findOne({
      where: { id, user_id: userId },
    });
    if (!answer) {
      throw new NotFoundException(`Answer with ID ${id} not found`);
    }
    return answer;
  }

  async update(userId: string, id: string, dto: UpdateAnswerDto): Promise<Answer> {
    const answer = await this.findOne(userId, id);
    Object.assign(answer, dto);
    return this.answerRepository.save(answer);
  }

  async remove(userId: string, id: string): Promise<void> {
    const answer = await this.findOne(userId, id);
    await this.answerRepository.remove(answer);
  }

  async incrementUsage(id: string): Promise<void> {
    await this.answerRepository.increment({ id }, 'usage_count', 1);
  }

  /**
   * Find the best matching answer for a given question
   */
  async findBestMatch(userId: string, question: string): Promise<MatchedAnswer | null> {
    const normalizedQuestion = question.toLowerCase().trim();

    // 1. Try exact pattern match first
    const exactMatch = await this.answerRepository.findOne({
      where: {
        user_id: userId,
        question_pattern: ILike(`%${normalizedQuestion}%`),
        is_active: true,
      },
      order: { usage_count: 'DESC' },
    });

    if (exactMatch) {
      return {
        answer: exactMatch,
        matchScore: 1.0,
        matchType: 'exact',
      };
    }

    // 2. Detect category from question patterns
    const detectedCategory = this.detectCategory(question);

    if (detectedCategory) {
      // Find answers in this category
      const categoryAnswers = await this.answerRepository.find({
        where: { user_id: userId, category: detectedCategory, is_active: true },
        order: { confidence_score: 'DESC', usage_count: 'DESC' },
      });

      if (categoryAnswers.length > 0) {
        // Find best match by keywords
        const bestKeywordMatch = this.findBestKeywordMatch(normalizedQuestion, categoryAnswers);
        if (bestKeywordMatch) {
          return bestKeywordMatch;
        }

        // Return highest confidence answer in category
        return {
          answer: categoryAnswers[0],
          matchScore: 0.7,
          matchType: 'pattern',
        };
      }
    }

    // 3. Try keyword matching across all answers
    const allAnswers = await this.answerRepository.find({
      where: { user_id: userId, is_active: true },
    });

    const keywordMatch = this.findBestKeywordMatch(normalizedQuestion, allAnswers);
    if (keywordMatch) {
      return keywordMatch;
    }

    return null;
  }

  /**
   * Detect the category of a question based on patterns
   */
  detectCategory(question: string): QuestionCategory | null {
    for (const [category, patterns] of this.questionPatterns) {
      for (const pattern of patterns) {
        if (pattern.test(question)) {
          return category;
        }
      }
    }
    return null;
  }

  /**
   * Find best match based on keyword overlap
   */
  private findBestKeywordMatch(question: string, answers: Answer[]): MatchedAnswer | null {
    const questionWords = new Set(
      question
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 2)
    );

    let bestMatch: MatchedAnswer | null = null;
    let highestScore = 0;

    for (const answer of answers) {
      if (!answer.keywords || answer.keywords.length === 0) {continue;}

      const matchingKeywords = answer.keywords.filter(kw =>
        questionWords.has(kw.toLowerCase()) ||
        question.toLowerCase().includes(kw.toLowerCase())
      );

      const score = matchingKeywords.length / answer.keywords.length;

      if (score > highestScore && score >= 0.3) {
        highestScore = score;
        bestMatch = {
          answer,
          matchScore: score,
          matchType: 'keyword',
        };
      }
    }

    return bestMatch;
  }

  /**
   * Get or generate an answer for a question
   * Returns the matched answer value or null if no match found
   */
  async getAnswerForQuestion(userId: string, question: string): Promise<string | null> {
    const match = await this.findBestMatch(userId, question);

    if (match && match.matchScore >= 0.5) {
      await this.incrementUsage(match.answer.id);
      this.logger.log(
        `Found ${match.matchType} match (score: ${match.matchScore}) for question: "${question.substring(0, 50)}..."`,
      );
      return match.answer.answer_value;
    }

    return null;
  }

  /**
   * Initialize default answers for a user
   */
  async initializeDefaults(userId: string, userData: {
    firstName?: string;
    lastName?: string;
    yearsOfExperience?: number;
    salaryExpectation?: string;
    availability?: string;
    workAuthorization?: boolean;
    requiresSponsorship?: boolean;
  }): Promise<Answer[]> {
    const defaults: CreateAnswerDto[] = [
      // Work Authorization
      {
        category: QuestionCategory.WORK_AUTHORIZATION,
        answer_type: AnswerType.YES_NO,
        question_pattern: 'Are you authorized to work in the United States?',
        keywords: ['authorized', 'work', 'united states', 'legally'],
        answer_value: userData.workAuthorization !== false ? 'Yes' : 'No',
        confidence_score: 0.95,
      },
      {
        category: QuestionCategory.WORK_AUTHORIZATION,
        answer_type: AnswerType.YES_NO,
        question_pattern: 'Will you now or in the future require sponsorship?',
        keywords: ['sponsorship', 'visa', 'require', 'future'],
        answer_value: userData.requiresSponsorship ? 'Yes' : 'No',
        confidence_score: 0.95,
      },
      // Availability
      {
        category: QuestionCategory.AVAILABILITY,
        answer_type: AnswerType.TEXT,
        question_pattern: 'When can you start?',
        keywords: ['start', 'available', 'begin', 'availability'],
        answer_value: userData.availability || '2 weeks notice',
        confidence_score: 0.9,
      },
      // Salary
      {
        category: QuestionCategory.SALARY,
        answer_type: AnswerType.TEXT,
        question_pattern: 'What are your salary expectations?',
        keywords: ['salary', 'compensation', 'pay', 'expectation', 'desired'],
        answer_value: userData.salaryExpectation || 'Negotiable based on total compensation',
        confidence_score: 0.85,
      },
      // Experience
      {
        category: QuestionCategory.EXPERIENCE,
        answer_type: AnswerType.NUMBER,
        question_pattern: 'How many years of experience do you have?',
        keywords: ['years', 'experience', 'how many', 'how much'],
        answer_value: String(userData.yearsOfExperience || 5),
        confidence_score: 0.9,
      },
      // Relocation
      {
        category: QuestionCategory.RELOCATION,
        answer_type: AnswerType.YES_NO,
        question_pattern: 'Are you willing to relocate?',
        keywords: ['relocate', 'relocation', 'move', 'willing'],
        answer_value: 'Yes, for the right opportunity',
        confidence_score: 0.8,
      },
      // Background Check
      {
        category: QuestionCategory.BACKGROUND_CHECK,
        answer_type: AnswerType.YES_NO,
        question_pattern: 'Are you willing to undergo a background check?',
        keywords: ['background', 'check', 'willing', 'undergo'],
        answer_value: 'Yes',
        confidence_score: 0.95,
      },
      // Referral
      {
        category: QuestionCategory.REFERRAL,
        answer_type: AnswerType.TEXT,
        question_pattern: 'How did you hear about this position?',
        keywords: ['hear', 'find', 'learn', 'source', 'referred'],
        answer_value: 'Company career page',
        confidence_score: 0.7,
      },
      // Veteran Status
      {
        category: QuestionCategory.VETERAN_STATUS,
        answer_type: AnswerType.SELECT,
        question_pattern: 'What is your veteran status?',
        keywords: ['veteran', 'military', 'served'],
        answer_value: 'I am not a protected veteran',
        answer_options: [
          'I am a protected veteran',
          'I am not a protected veteran',
          'I decline to self-identify',
        ],
        confidence_score: 0.9,
      },
      // Disability
      {
        category: QuestionCategory.DISABILITY,
        answer_type: AnswerType.SELECT,
        question_pattern: 'Do you have a disability?',
        keywords: ['disability', 'accommodation', 'disabled'],
        answer_value: 'I decline to answer',
        answer_options: [
          'Yes, I have a disability',
          'No, I do not have a disability',
          'I decline to answer',
        ],
        confidence_score: 0.9,
      },
    ];

    return this.bulkCreate(userId, defaults);
  }
}
