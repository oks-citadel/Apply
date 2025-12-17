import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InvoicesService } from './invoices.service';
import { Invoice } from './entities/invoice.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceStatus } from '../../common/enums/invoice-status.enum';
import { LoggingService } from '../../common/logging/logging.service';

describe('InvoicesService', () => {
  let service: InvoicesService;
  let invoiceRepository: jest.Mocked<Repository<Invoice>>;
  let paymentEventClient: jest.Mocked<ClientProxy>;
  let loggingService: jest.Mocked<LoggingService>;

  const mockInvoice: Invoice = {
    id: 'invoice_uuid_123',
    subscriptionId: 'sub_uuid_456',
    stripeInvoiceId: 'in_stripe_123',
    stripeCustomerId: 'cus_stripe_789',
    amount: 49.99,
    currency: 'usd',
    status: InvoiceStatus.DRAFT,
    paidAt: null as any,
    invoiceUrl: 'https://invoice.stripe.com/i/test',
    invoicePdfUrl: 'https://pay.stripe.com/invoice/test/pdf',
    metadata: { billingPeriod: 'monthly' },
    createdAt: new Date(),
    updatedAt: new Date(),
    subscription: null as any,
    isPaid: jest.fn().mockReturnValue(false),
    isOpen: jest.fn().mockReturnValue(false),
    isVoid: jest.fn().mockReturnValue(false),
    isUncollectible: jest.fn().mockReturnValue(false),
  };

  const mockPaidInvoice: Invoice = {
    ...mockInvoice,
    id: 'invoice_uuid_paid',
    status: InvoiceStatus.PAID,
    paidAt: new Date(),
    isPaid: jest.fn().mockReturnValue(true),
  };

  const mockCreateInvoiceDto: CreateInvoiceDto = {
    subscriptionId: 'sub_uuid_456',
    stripeInvoiceId: 'in_stripe_new',
    stripeCustomerId: 'cus_stripe_789',
    amount: 49.99,
    currency: 'usd',
    status: InvoiceStatus.OPEN,
  };

  const mockUpdateInvoiceDto: UpdateInvoiceDto = {
    status: InvoiceStatus.PAID,
    paidAt: new Date(),
  };

  beforeEach(async () => {
    // Create mock query builder
    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ total: '499.90' }),
    } as unknown as jest.Mocked<SelectQueryBuilder<Invoice>>;

    // Create mock repository
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      count: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    // Create mock client proxy
    const mockClientProxy = {
      emit: jest.fn(),
    };

    // Create mock logging service
    const mockLoggingService = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      logEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        {
          provide: getRepositoryToken(Invoice),
          useValue: mockRepository,
        },
        {
          provide: 'PAYMENT_SERVICE',
          useValue: mockClientProxy,
        },
        {
          provide: LoggingService,
          useValue: mockLoggingService,
        },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
    invoiceRepository = module.get(getRepositoryToken(Invoice));
    paymentEventClient = module.get('PAYMENT_SERVICE');
    loggingService = module.get(LoggingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an invoice successfully', async () => {
      invoiceRepository.create.mockReturnValue(mockInvoice);
      invoiceRepository.save.mockResolvedValue(mockInvoice);

      const result = await service.create(mockCreateInvoiceDto);

      expect(result).toEqual(mockInvoice);
      expect(invoiceRepository.create).toHaveBeenCalledWith(mockCreateInvoiceDto);
      expect(invoiceRepository.save).toHaveBeenCalledWith(mockInvoice);
      expect(paymentEventClient.emit).toHaveBeenCalledWith('invoice.created', mockInvoice);
      expect(loggingService.logEvent).toHaveBeenCalledWith(
        'invoice.created',
        mockInvoice,
        'InvoicesService',
      );
    });

    it('should throw error when save fails', async () => {
      invoiceRepository.create.mockReturnValue(mockInvoice);
      invoiceRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.create(mockCreateInvoiceDto)).rejects.toThrow('Database error');
    });

    it('should handle duplicate stripeInvoiceId error', async () => {
      invoiceRepository.create.mockReturnValue(mockInvoice);
      const duplicateError = new Error('Duplicate key violation');
      invoiceRepository.save.mockRejectedValue(duplicateError);

      await expect(service.create(mockCreateInvoiceDto)).rejects.toThrow(
        'Duplicate key violation',
      );
    });
  });

  describe('createOrUpdate', () => {
    it('should create new invoice when not found', async () => {
      invoiceRepository.findOne.mockResolvedValue(null);
      invoiceRepository.create.mockReturnValue(mockInvoice);
      invoiceRepository.save.mockResolvedValue(mockInvoice);

      const result = await service.createOrUpdate(mockCreateInvoiceDto);

      expect(result).toEqual(mockInvoice);
      expect(invoiceRepository.create).toHaveBeenCalled();
    });

    it('should update existing invoice when found', async () => {
      const existingInvoice = { ...mockInvoice };
      invoiceRepository.findOne
        .mockResolvedValueOnce(existingInvoice) // findByStripeInvoiceId
        .mockResolvedValueOnce(existingInvoice); // findOne in update

      const updatedInvoice = { ...existingInvoice, ...mockCreateInvoiceDto };
      invoiceRepository.save.mockResolvedValue(updatedInvoice);

      const result = await service.createOrUpdate(mockCreateInvoiceDto);

      expect(result).toEqual(updatedInvoice);
      expect(invoiceRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error when update fails', async () => {
      invoiceRepository.findOne.mockResolvedValue(mockInvoice);
      invoiceRepository.save.mockRejectedValue(new Error('Update failed'));

      await expect(service.createOrUpdate(mockCreateInvoiceDto)).rejects.toThrow(
        'Update failed',
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated invoices', async () => {
      const invoices = [mockInvoice, mockPaidInvoice];
      invoiceRepository.findAndCount.mockResolvedValue([invoices, 2]);

      const result = await service.findAll(1, 10);

      expect(result).toEqual({
        data: invoices,
        total: 2,
        page: 1,
        lastPage: 1,
      });
      expect(invoiceRepository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
        relations: ['subscription'],
      });
    });

    it('should handle pagination correctly', async () => {
      invoiceRepository.findAndCount.mockResolvedValue([[mockInvoice], 25]);

      const result = await service.findAll(3, 10);

      expect(result).toEqual({
        data: [mockInvoice],
        total: 25,
        page: 3,
        lastPage: 3,
      });
      expect(invoiceRepository.findAndCount).toHaveBeenCalledWith({
        skip: 20,
        take: 10,
        order: { createdAt: 'DESC' },
        relations: ['subscription'],
      });
    });

    it('should use default pagination values', async () => {
      invoiceRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll();

      expect(invoiceRepository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
        relations: ['subscription'],
      });
    });
  });

  describe('findOne', () => {
    it('should return invoice when found', async () => {
      invoiceRepository.findOne.mockResolvedValue(mockInvoice);

      const result = await service.findOne('invoice_uuid_123');

      expect(result).toEqual(mockInvoice);
      expect(invoiceRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'invoice_uuid_123' },
        relations: ['subscription'],
      });
    });

    it('should throw NotFoundException when invoice not found', async () => {
      invoiceRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent_id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByStripeInvoiceId', () => {
    it('should return invoice when found', async () => {
      invoiceRepository.findOne.mockResolvedValue(mockInvoice);

      const result = await service.findByStripeInvoiceId('in_stripe_123');

      expect(result).toEqual(mockInvoice);
      expect(invoiceRepository.findOne).toHaveBeenCalledWith({
        where: { stripeInvoiceId: 'in_stripe_123' },
        relations: ['subscription'],
      });
    });

    it('should return null when invoice not found', async () => {
      invoiceRepository.findOne.mockResolvedValue(null);

      const result = await service.findByStripeInvoiceId('nonexistent_stripe_id');

      expect(result).toBeNull();
    });
  });

  describe('findBySubscriptionId', () => {
    it('should return paginated invoices for subscription', async () => {
      const invoices = [mockInvoice];
      invoiceRepository.findAndCount.mockResolvedValue([invoices, 1]);

      const result = await service.findBySubscriptionId('sub_uuid_456', 1, 10);

      expect(result).toEqual({
        data: invoices,
        total: 1,
        page: 1,
        lastPage: 1,
      });
      expect(invoiceRepository.findAndCount).toHaveBeenCalledWith({
        where: { subscriptionId: 'sub_uuid_456' },
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
        relations: ['subscription'],
      });
    });

    it('should return empty array when no invoices found', async () => {
      invoiceRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findBySubscriptionId('sub_no_invoices');

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('findByStripeCustomerId', () => {
    it('should return paginated invoices for customer', async () => {
      const invoices = [mockInvoice, mockPaidInvoice];
      invoiceRepository.findAndCount.mockResolvedValue([invoices, 2]);

      const result = await service.findByStripeCustomerId('cus_stripe_789', 1, 10);

      expect(result).toEqual({
        data: invoices,
        total: 2,
        page: 1,
        lastPage: 1,
      });
      expect(invoiceRepository.findAndCount).toHaveBeenCalledWith({
        where: { stripeCustomerId: 'cus_stripe_789' },
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
        relations: ['subscription'],
      });
    });
  });

  describe('update', () => {
    it('should update invoice successfully', async () => {
      const existingInvoice = { ...mockInvoice, status: InvoiceStatus.OPEN };
      existingInvoice.isPaid = jest.fn().mockReturnValue(false);
      invoiceRepository.findOne.mockResolvedValue(existingInvoice);

      const updatedInvoice = { ...existingInvoice, ...mockUpdateInvoiceDto };
      updatedInvoice.isPaid = jest.fn().mockReturnValue(true);
      invoiceRepository.save.mockResolvedValue(updatedInvoice);

      const result = await service.update('invoice_uuid_123', mockUpdateInvoiceDto);

      expect(result).toEqual(updatedInvoice);
      expect(invoiceRepository.save).toHaveBeenCalled();
    });

    it('should emit status changed event when status changes', async () => {
      const existingInvoice = { ...mockInvoice, status: InvoiceStatus.OPEN };
      existingInvoice.isPaid = jest.fn().mockReturnValue(false);
      invoiceRepository.findOne.mockResolvedValue(existingInvoice);

      const updatedInvoice = { ...existingInvoice, status: InvoiceStatus.PAID };
      updatedInvoice.isPaid = jest.fn().mockReturnValue(true);
      invoiceRepository.save.mockResolvedValue(updatedInvoice);

      await service.update('invoice_uuid_123', { status: InvoiceStatus.PAID });

      expect(paymentEventClient.emit).toHaveBeenCalledWith(
        'invoice.status.changed',
        expect.objectContaining({
          previousStatus: InvoiceStatus.OPEN,
          newStatus: InvoiceStatus.PAID,
        }),
      );
    });

    it('should emit invoice.paid event when status changes to paid', async () => {
      const existingInvoice = { ...mockInvoice, status: InvoiceStatus.OPEN };
      existingInvoice.isPaid = jest.fn().mockReturnValue(false);
      invoiceRepository.findOne.mockResolvedValue(existingInvoice);

      const updatedInvoice = { ...existingInvoice, status: InvoiceStatus.PAID };
      updatedInvoice.isPaid = jest.fn().mockReturnValue(true);
      invoiceRepository.save.mockResolvedValue(updatedInvoice);

      await service.update('invoice_uuid_123', { status: InvoiceStatus.PAID });

      expect(paymentEventClient.emit).toHaveBeenCalledWith('invoice.paid', updatedInvoice);
    });

    it('should not emit events when status does not change', async () => {
      const existingInvoice = { ...mockInvoice, status: InvoiceStatus.OPEN };
      existingInvoice.isPaid = jest.fn().mockReturnValue(false);
      invoiceRepository.findOne.mockResolvedValue(existingInvoice);

      const updatedInvoice = { ...existingInvoice, invoiceUrl: 'https://new-url.com' };
      updatedInvoice.isPaid = jest.fn().mockReturnValue(false);
      invoiceRepository.save.mockResolvedValue(updatedInvoice);

      await service.update('invoice_uuid_123', { invoiceUrl: 'https://new-url.com' });

      expect(paymentEventClient.emit).not.toHaveBeenCalledWith(
        'invoice.status.changed',
        expect.anything(),
      );
    });

    it('should throw NotFoundException when invoice not found', async () => {
      invoiceRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent_id', mockUpdateInvoiceDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error when save fails', async () => {
      invoiceRepository.findOne.mockResolvedValue(mockInvoice);
      invoiceRepository.save.mockRejectedValue(new Error('Save failed'));

      await expect(
        service.update('invoice_uuid_123', mockUpdateInvoiceDto),
      ).rejects.toThrow('Save failed');
    });
  });

  describe('markAsPaid', () => {
    it('should mark invoice as paid', async () => {
      const existingInvoice = { ...mockInvoice, status: InvoiceStatus.OPEN };
      invoiceRepository.findOne.mockResolvedValue(existingInvoice);

      const paidInvoice = {
        ...existingInvoice,
        status: 'paid',
        paidAt: expect.any(Date),
      };
      invoiceRepository.save.mockResolvedValue(paidInvoice);

      const result = await service.markAsPaid('invoice_uuid_123');

      expect(result.status).toBe('paid');
      expect(result.paidAt).toBeDefined();
      expect(paymentEventClient.emit).toHaveBeenCalledWith('invoice.paid', paidInvoice);
    });

    it('should throw NotFoundException when invoice not found', async () => {
      invoiceRepository.findOne.mockResolvedValue(null);

      await expect(service.markAsPaid('nonexistent_id')).rejects.toThrow(NotFoundException);
    });

    it('should set paidAt date to current time', async () => {
      const before = new Date();
      invoiceRepository.findOne.mockResolvedValue({ ...mockInvoice });
      invoiceRepository.save.mockImplementation(async (invoice) => invoice as Invoice);

      const result = await service.markAsPaid('invoice_uuid_123');
      const after = new Date();

      expect(result.paidAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.paidAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('markAsVoid', () => {
    it('should mark invoice as void', async () => {
      const existingInvoice = { ...mockInvoice, status: InvoiceStatus.OPEN };
      invoiceRepository.findOne.mockResolvedValue(existingInvoice);

      const voidInvoice = { ...existingInvoice, status: 'void' };
      invoiceRepository.save.mockResolvedValue(voidInvoice);

      const result = await service.markAsVoid('invoice_uuid_123');

      expect(result.status).toBe('void');
      expect(paymentEventClient.emit).toHaveBeenCalledWith('invoice.voided', voidInvoice);
    });

    it('should throw NotFoundException when invoice not found', async () => {
      invoiceRepository.findOne.mockResolvedValue(null);

      await expect(service.markAsVoid('nonexistent_id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStatistics', () => {
    it('should return invoice statistics', async () => {
      invoiceRepository.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(80) // paid
        .mockResolvedValueOnce(15); // open

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '7999.20' }),
      };
      invoiceRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as unknown as SelectQueryBuilder<Invoice>,
      );

      const result = await service.getStatistics();

      expect(result).toEqual({
        totalInvoices: 100,
        paidInvoices: 80,
        openInvoices: 15,
        totalRevenue: 7999.2,
      });
    });

    it('should return zero revenue when no paid invoices', async () => {
      invoiceRepository.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(10);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: null }),
      };
      invoiceRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as unknown as SelectQueryBuilder<Invoice>,
      );

      const result = await service.getStatistics();

      expect(result.totalRevenue).toBe(0);
    });

    it('should handle empty database', async () => {
      invoiceRepository.count.mockResolvedValue(0);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: null }),
      };
      invoiceRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as unknown as SelectQueryBuilder<Invoice>,
      );

      const result = await service.getStatistics();

      expect(result).toEqual({
        totalInvoices: 0,
        paidInvoices: 0,
        openInvoices: 0,
        totalRevenue: 0,
      });
    });
  });

  describe('remove', () => {
    it('should remove invoice successfully', async () => {
      invoiceRepository.findOne.mockResolvedValue(mockInvoice);
      invoiceRepository.remove.mockResolvedValue(mockInvoice);

      await service.remove('invoice_uuid_123');

      expect(invoiceRepository.remove).toHaveBeenCalledWith(mockInvoice);
    });

    it('should throw NotFoundException when invoice not found', async () => {
      invoiceRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent_id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('emitInvoiceEvent (private method behavior)', () => {
    it('should not throw when event emission fails', async () => {
      invoiceRepository.create.mockReturnValue(mockInvoice);
      invoiceRepository.save.mockResolvedValue(mockInvoice);
      paymentEventClient.emit.mockImplementation(() => {
        throw new Error('Event emission failed');
      });

      // Should not throw even if emit fails
      const result = await service.create(mockCreateInvoiceDto);

      expect(result).toEqual(mockInvoice);
    });
  });

  describe('Edge Cases', () => {
    it('should handle invoice with all optional fields', async () => {
      const fullInvoiceDto: CreateInvoiceDto = {
        subscriptionId: 'sub_123',
        stripeInvoiceId: 'in_full',
        stripeCustomerId: 'cus_full',
        amount: 99.99,
        currency: 'eur',
        status: InvoiceStatus.PAID,
        paidAt: new Date(),
        invoiceUrl: 'https://invoice.stripe.com/full',
        invoicePdfUrl: 'https://pay.stripe.com/invoice/full/pdf',
        metadata: { plan: 'enterprise', seats: 10 },
      };

      invoiceRepository.create.mockReturnValue({ ...mockInvoice, ...fullInvoiceDto } as any);
      invoiceRepository.save.mockResolvedValue({ ...mockInvoice, ...fullInvoiceDto } as any);

      const result = await service.create(fullInvoiceDto);

      expect(result.metadata).toEqual({ plan: 'enterprise', seats: 10 });
    });

    it('should handle very large amount values', async () => {
      const largeAmountDto: CreateInvoiceDto = {
        ...mockCreateInvoiceDto,
        amount: 999999.99,
      };

      invoiceRepository.create.mockReturnValue({ ...mockInvoice, amount: 999999.99 } as any);
      invoiceRepository.save.mockResolvedValue({ ...mockInvoice, amount: 999999.99 } as any);

      const result = await service.create(largeAmountDto);

      expect(result.amount).toBe(999999.99);
    });

    it('should handle different currency codes', async () => {
      const currencies = ['usd', 'eur', 'gbp', 'ngn', 'jpy'];

      for (const currency of currencies) {
        invoiceRepository.create.mockReturnValue({ ...mockInvoice, currency } as any);
        invoiceRepository.save.mockResolvedValue({ ...mockInvoice, currency } as any);

        const result = await service.create({ ...mockCreateInvoiceDto, currency });

        expect(result.currency).toBe(currency);
      }
    });

    it('should handle all invoice statuses', async () => {
      const statuses = [
        InvoiceStatus.DRAFT,
        InvoiceStatus.OPEN,
        InvoiceStatus.PAID,
        InvoiceStatus.VOID,
        InvoiceStatus.UNCOLLECTIBLE,
      ];

      for (const status of statuses) {
        invoiceRepository.findOne.mockResolvedValue({ ...mockInvoice, status } as any);

        const result = await service.findOne('invoice_uuid_123');

        expect(result.status).toBe(status);
      }
    });

    it('should handle concurrent update requests', async () => {
      invoiceRepository.findOne.mockResolvedValue({ ...mockInvoice } as any);
      invoiceRepository.save.mockImplementation(async (invoice) => invoice as Invoice);

      const promises = [
        service.update('invoice_uuid_123', { invoiceUrl: 'https://url1.com' }),
        service.update('invoice_uuid_123', { invoiceUrl: 'https://url2.com' }),
        service.update('invoice_uuid_123', { invoiceUrl: 'https://url3.com' }),
      ];

      const results = await Promise.all(promises);

      expect(results.length).toBe(3);
      expect(invoiceRepository.save).toHaveBeenCalledTimes(3);
    });
  });
});
