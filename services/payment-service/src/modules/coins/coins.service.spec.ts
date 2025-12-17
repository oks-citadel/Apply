import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  CoinsService,
  CoinBalance,
  CoinTransaction,
  VisibilityBoost,
} from './coins.service';
import {
  SubscriptionTier,
  VIRTUAL_COIN_PACKAGES,
  BOOST_VISIBILITY_COSTS,
  SUBSCRIPTION_TIER_LIMITS,
} from '../../common/enums/subscription-tier.enum';

describe('CoinsService', () => {
  let service: CoinsService;
  let configService: ConfigService;

  const mockUserId = 'user_test_123';

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'COIN_PACKAGE_DISCOUNT':
            return 0;
          default:
            return null;
        }
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoinsService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<CoinsService>(CoinsService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Clear internal state
    (service as any).coinBalances = new Map();
    (service as any).coinTransactions = [];
    (service as any).visibilityBoosts = [];
  });

  describe('getBalance', () => {
    it('should return zero balance for new user', async () => {
      const balance = await service.getBalance(mockUserId);

      expect(balance).toEqual({
        userId: mockUserId,
        balance: 0,
        monthlyAllocation: 0,
        lastAllocationDate: expect.any(Date),
      });
    });

    it('should return existing balance for user with coins', async () => {
      // First credit some coins
      await service.creditCoins(mockUserId, 100, 'Test credit');

      const balance = await service.getBalance(mockUserId);

      expect(balance.balance).toBe(100);
      expect(balance.userId).toBe(mockUserId);
    });

    it('should create new balance entry for unknown user', async () => {
      const newUserId = 'new_user_456';
      const balance = await service.getBalance(newUserId);

      expect(balance.userId).toBe(newUserId);
      expect(balance.balance).toBe(0);
    });
  });

  describe('creditCoins', () => {
    it('should credit coins to user account', async () => {
      const result = await service.creditCoins(mockUserId, 500, 'Purchase');

      expect(result.balance).toBe(500);
      expect(result.userId).toBe(mockUserId);
    });

    it('should add to existing balance', async () => {
      await service.creditCoins(mockUserId, 100, 'Initial credit');
      const result = await service.creditCoins(mockUserId, 200, 'Additional credit');

      expect(result.balance).toBe(300);
    });

    it('should record transaction with metadata', async () => {
      await service.creditCoins(mockUserId, 100, 'Test credit', { source: 'purchase' });

      const transactions = await service.getTransactionHistory(mockUserId);

      expect(transactions.length).toBe(1);
      expect(transactions[0]).toEqual(
        expect.objectContaining({
          userId: mockUserId,
          amount: 100,
          type: 'CREDIT',
          reason: 'Test credit',
          metadata: { source: 'purchase' },
        }),
      );
    });

    it('should generate unique transaction IDs', async () => {
      await service.creditCoins(mockUserId, 100, 'Credit 1');
      await service.creditCoins(mockUserId, 200, 'Credit 2');

      const transactions = await service.getTransactionHistory(mockUserId);

      expect(transactions[0].id).not.toBe(transactions[1].id);
    });
  });

  describe('debitCoins', () => {
    it('should debit coins from user account', async () => {
      await service.creditCoins(mockUserId, 500, 'Initial credit');
      const result = await service.debitCoins(mockUserId, 100, 'Purchase');

      expect(result.balance).toBe(400);
    });

    it('should throw BadRequestException for insufficient balance', async () => {
      await service.creditCoins(mockUserId, 50, 'Small credit');

      await expect(
        service.debitCoins(mockUserId, 100, 'Over-spend'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for zero balance', async () => {
      await expect(
        service.debitCoins(mockUserId, 100, 'No balance'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should record debit transaction with negative amount', async () => {
      await service.creditCoins(mockUserId, 500, 'Initial');
      await service.debitCoins(mockUserId, 100, 'Spend', { itemId: 'item123' });

      const transactions = await service.getTransactionHistory(mockUserId);
      const debitTx = transactions.find((t) => t.type === 'DEBIT');

      expect(debitTx).toEqual(
        expect.objectContaining({
          amount: -100,
          type: 'DEBIT',
          reason: 'Spend',
          metadata: { itemId: 'item123' },
        }),
      );
    });
  });

  describe('allocateMonthlyCoins', () => {
    it('should allocate monthly coins for FREEMIUM tier', async () => {
      const result = await service.allocateMonthlyCoins(mockUserId, SubscriptionTier.FREEMIUM);

      expect(result.balance).toBe(SUBSCRIPTION_TIER_LIMITS[SubscriptionTier.FREEMIUM].virtualCoinsPerMonth);
      expect(result.monthlyAllocation).toBe(SUBSCRIPTION_TIER_LIMITS[SubscriptionTier.FREEMIUM].virtualCoinsPerMonth);
    });

    it('should allocate monthly coins for BASIC tier', async () => {
      const result = await service.allocateMonthlyCoins(mockUserId, SubscriptionTier.BASIC);

      expect(result.balance).toBe(SUBSCRIPTION_TIER_LIMITS[SubscriptionTier.BASIC].virtualCoinsPerMonth);
    });

    it('should allocate monthly coins for PROFESSIONAL tier', async () => {
      const result = await service.allocateMonthlyCoins(mockUserId, SubscriptionTier.PROFESSIONAL);

      expect(result.balance).toBe(SUBSCRIPTION_TIER_LIMITS[SubscriptionTier.PROFESSIONAL].virtualCoinsPerMonth);
    });

    it('should allocate large amount for EXECUTIVE_ELITE (unlimited) tier', async () => {
      const result = await service.allocateMonthlyCoins(mockUserId, SubscriptionTier.EXECUTIVE_ELITE);

      expect(result.balance).toBe(50000); // As per service implementation
    });

    it('should not re-allocate if already allocated this month', async () => {
      await service.allocateMonthlyCoins(mockUserId, SubscriptionTier.BASIC);
      const firstBalance = (await service.getBalance(mockUserId)).balance;

      // Try to allocate again
      await service.allocateMonthlyCoins(mockUserId, SubscriptionTier.BASIC);
      const secondBalance = (await service.getBalance(mockUserId)).balance;

      expect(secondBalance).toBe(firstBalance);
    });

    it('should update lastAllocationDate', async () => {
      const before = new Date();
      await service.allocateMonthlyCoins(mockUserId, SubscriptionTier.BASIC);
      const after = new Date();

      const balance = await service.getBalance(mockUserId);

      expect(balance.lastAllocationDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(balance.lastAllocationDate.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('purchaseCoinPackage', () => {
    it('should purchase first coin package', async () => {
      const packageIndex = 0;
      const coinPackage = VIRTUAL_COIN_PACKAGES[packageIndex];
      const expectedCoins = coinPackage.coins + coinPackage.bonus;

      const result = await service.purchaseCoinPackage(
        mockUserId,
        packageIndex,
        'payment_ref_123',
      );

      expect(result.balance).toBe(expectedCoins);
    });

    it('should purchase largest coin package', async () => {
      const packageIndex = VIRTUAL_COIN_PACKAGES.length - 1;
      const coinPackage = VIRTUAL_COIN_PACKAGES[packageIndex];
      const expectedCoins = coinPackage.coins + coinPackage.bonus;

      const result = await service.purchaseCoinPackage(
        mockUserId,
        packageIndex,
        'payment_ref_456',
      );

      expect(result.balance).toBe(expectedCoins);
    });

    it('should throw BadRequestException for invalid package index', async () => {
      await expect(
        service.purchaseCoinPackage(mockUserId, -1, 'payment_ref'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.purchaseCoinPackage(mockUserId, 999, 'payment_ref'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should record purchase metadata in transaction', async () => {
      const packageIndex = 2;
      const coinPackage = VIRTUAL_COIN_PACKAGES[packageIndex];

      await service.purchaseCoinPackage(mockUserId, packageIndex, 'payment_ref_789');

      const transactions = await service.getTransactionHistory(mockUserId);
      const purchaseTx = transactions[0];

      expect(purchaseTx.metadata).toEqual(
        expect.objectContaining({
          packageIndex,
          paymentReference: 'payment_ref_789',
          baseCoins: coinPackage.coins,
          bonusCoins: coinPackage.bonus,
          price: coinPackage.price,
          currency: coinPackage.currency,
        }),
      );
    });
  });

  describe('getCoinPackages', () => {
    it('should return all available coin packages', () => {
      const packages = service.getCoinPackages();

      expect(packages).toEqual(VIRTUAL_COIN_PACKAGES);
      expect(packages.length).toBeGreaterThan(0);
    });
  });

  describe('getTransactionHistory', () => {
    it('should return empty array for user with no transactions', async () => {
      const history = await service.getTransactionHistory(mockUserId);

      expect(history).toEqual([]);
    });

    it('should return transactions in reverse chronological order', async () => {
      await service.creditCoins(mockUserId, 100, 'First');
      await service.creditCoins(mockUserId, 200, 'Second');
      await service.creditCoins(mockUserId, 300, 'Third');

      const history = await service.getTransactionHistory(mockUserId);

      expect(history[0].reason).toBe('Third');
      expect(history[1].reason).toBe('Second');
      expect(history[2].reason).toBe('First');
    });

    it('should respect limit parameter', async () => {
      for (let i = 0; i < 10; i++) {
        await service.creditCoins(mockUserId, 10, `Transaction ${i}`);
      }

      const history = await service.getTransactionHistory(mockUserId, 5);

      expect(history.length).toBe(5);
    });

    it('should respect offset parameter', async () => {
      for (let i = 0; i < 10; i++) {
        await service.creditCoins(mockUserId, 10, `Transaction ${i}`);
      }

      const history = await service.getTransactionHistory(mockUserId, 5, 3);

      expect(history.length).toBe(5);
      // Since sorted in reverse order, offset 3 should skip the 3 newest
      expect(history[0].reason).toBe('Transaction 6');
    });

    it('should only return transactions for specified user', async () => {
      await service.creditCoins(mockUserId, 100, 'User 1 transaction');
      await service.creditCoins('other_user', 200, 'User 2 transaction');

      const history = await service.getTransactionHistory(mockUserId);

      expect(history.length).toBe(1);
      expect(history[0].userId).toBe(mockUserId);
    });
  });

  describe('boostVisibility', () => {
    beforeEach(async () => {
      // Give user enough coins for testing
      await service.creditCoins(mockUserId, 1000, 'Test credit');
    });

    it('should create basic boost successfully', async () => {
      const result = await service.boostVisibility(
        mockUserId,
        'basic',
        'resume',
        'resume_123',
      );

      expect(result).toEqual(
        expect.objectContaining({
          userId: mockUserId,
          resumeId: 'resume_123',
          boostType: 'basic',
          coinsSpent: BOOST_VISIBILITY_COSTS.basic.coins,
          status: 'active',
        }),
      );
    });

    it('should create premium boost successfully', async () => {
      const result = await service.boostVisibility(
        mockUserId,
        'premium',
        'application',
        'app_456',
      );

      expect(result.boostType).toBe('premium');
      expect(result.coinsSpent).toBe(BOOST_VISIBILITY_COSTS.premium.coins);
      expect(result.jobApplicationId).toBe('app_456');
    });

    it('should create featured boost successfully', async () => {
      const result = await service.boostVisibility(
        mockUserId,
        'featured',
        'resume',
        'resume_789',
      );

      expect(result.boostType).toBe('featured');
      expect(result.coinsSpent).toBe(BOOST_VISIBILITY_COSTS.featured.coins);
    });

    it('should debit coins for boost', async () => {
      const initialBalance = (await service.getBalance(mockUserId)).balance;

      await service.boostVisibility(mockUserId, 'basic', 'resume', 'resume_123');

      const newBalance = (await service.getBalance(mockUserId)).balance;
      expect(newBalance).toBe(initialBalance - BOOST_VISIBILITY_COSTS.basic.coins);
    });

    it('should throw BadRequestException for insufficient coins', async () => {
      await service.debitCoins(mockUserId, 950, 'Spend most coins');

      await expect(
        service.boostVisibility(mockUserId, 'basic', 'resume', 'resume_123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for duplicate active boost', async () => {
      await service.boostVisibility(mockUserId, 'basic', 'resume', 'resume_123');

      await expect(
        service.boostVisibility(mockUserId, 'premium', 'resume', 'resume_123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should set correct end time based on boost type', async () => {
      const before = Date.now();
      const result = await service.boostVisibility(
        mockUserId,
        'basic',
        'resume',
        'resume_123',
      );
      const after = Date.now();

      const expectedDuration = BOOST_VISIBILITY_COSTS.basic.durationHours * 60 * 60 * 1000;
      const endTime = new Date(result.endTime).getTime();

      expect(endTime).toBeGreaterThanOrEqual(before + expectedDuration - 1000);
      expect(endTime).toBeLessThanOrEqual(after + expectedDuration + 1000);
    });
  });

  describe('getActiveBoosts', () => {
    beforeEach(async () => {
      await service.creditCoins(mockUserId, 1000, 'Test credit');
    });

    it('should return empty array when no boosts exist', async () => {
      const boosts = await service.getActiveBoosts(mockUserId);

      expect(boosts).toEqual([]);
    });

    it('should return active boosts only', async () => {
      await service.boostVisibility(mockUserId, 'basic', 'resume', 'resume_1');
      await service.boostVisibility(mockUserId, 'premium', 'resume', 'resume_2');

      const boosts = await service.getActiveBoosts(mockUserId);

      expect(boosts.length).toBe(2);
      expect(boosts.every((b) => b.status === 'active')).toBe(true);
    });

    it('should not return boosts for other users', async () => {
      await service.creditCoins('other_user', 500, 'Credit');
      await service.boostVisibility(mockUserId, 'basic', 'resume', 'resume_1');
      await service.boostVisibility('other_user', 'basic', 'resume', 'resume_2');

      const boosts = await service.getActiveBoosts(mockUserId);

      expect(boosts.length).toBe(1);
      expect(boosts[0].userId).toBe(mockUserId);
    });
  });

  describe('getBoostCosts', () => {
    it('should return all boost cost configurations', () => {
      const costs = service.getBoostCosts();

      expect(costs).toEqual(BOOST_VISIBILITY_COSTS);
      expect(costs.basic).toBeDefined();
      expect(costs.premium).toBeDefined();
      expect(costs.featured).toBeDefined();
    });
  });

  describe('cancelBoost', () => {
    beforeEach(async () => {
      await service.creditCoins(mockUserId, 1000, 'Test credit');
    });

    it('should cancel boost and provide partial refund', async () => {
      const boost = await service.boostVisibility(
        mockUserId,
        'basic',
        'resume',
        'resume_123',
      );

      const balanceAfterBoost = (await service.getBalance(mockUserId)).balance;
      const result = await service.cancelBoost(mockUserId, boost.id);

      expect(result.refundedCoins).toBeGreaterThan(0);
      expect(result.refundedCoins).toBeLessThan(BOOST_VISIBILITY_COSTS.basic.coins);

      const finalBalance = (await service.getBalance(mockUserId)).balance;
      expect(finalBalance).toBe(balanceAfterBoost + result.refundedCoins);
    });

    it('should throw NotFoundException for non-existent boost', async () => {
      await expect(
        service.cancelBoost(mockUserId, 'non_existent_boost_id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for boost belonging to other user', async () => {
      await service.creditCoins('other_user', 500, 'Credit');
      const boost = await service.boostVisibility(
        'other_user',
        'basic',
        'resume',
        'resume_123',
      );

      await expect(service.cancelBoost(mockUserId, boost.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for already cancelled boost', async () => {
      const boost = await service.boostVisibility(
        mockUserId,
        'basic',
        'resume',
        'resume_123',
      );

      await service.cancelBoost(mockUserId, boost.id);

      await expect(service.cancelBoost(mockUserId, boost.id)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should update boost status to cancelled', async () => {
      const boost = await service.boostVisibility(
        mockUserId,
        'basic',
        'resume',
        'resume_123',
      );

      await service.cancelBoost(mockUserId, boost.id);

      const boosts = (service as any).visibilityBoosts;
      const cancelledBoost = boosts.find((b: VisibilityBoost) => b.id === boost.id);
      expect(cancelledBoost.status).toBe('cancelled');
    });
  });

  describe('processExpiredBoosts', () => {
    it('should return 0 when no boosts exist', async () => {
      const count = await service.processExpiredBoosts();

      expect(count).toBe(0);
    });

    it('should mark expired boosts as expired', async () => {
      await service.creditCoins(mockUserId, 500, 'Credit');

      // Create a boost and manually set it to expired
      const boost = await service.boostVisibility(
        mockUserId,
        'basic',
        'resume',
        'resume_123',
      );

      // Manually set endTime to past
      const boosts = (service as any).visibilityBoosts;
      const createdBoost = boosts.find((b: VisibilityBoost) => b.id === boost.id);
      createdBoost.endTime = new Date(Date.now() - 1000);

      const count = await service.processExpiredBoosts();

      expect(count).toBe(1);
      expect(createdBoost.status).toBe('expired');
    });

    it('should not affect active boosts', async () => {
      await service.creditCoins(mockUserId, 500, 'Credit');
      const boost = await service.boostVisibility(
        mockUserId,
        'basic',
        'resume',
        'resume_123',
      );

      const count = await service.processExpiredBoosts();

      expect(count).toBe(0);

      const boosts = (service as any).visibilityBoosts;
      const activeBoost = boosts.find((b: VisibilityBoost) => b.id === boost.id);
      expect(activeBoost.status).toBe('active');
    });
  });

  describe('isItemBoosted', () => {
    beforeEach(async () => {
      await service.creditCoins(mockUserId, 500, 'Credit');
    });

    it('should return isBoosted: true for boosted resume', async () => {
      const boost = await service.boostVisibility(
        mockUserId,
        'basic',
        'resume',
        'resume_123',
      );

      const result = await service.isItemBoosted('resume', 'resume_123');

      expect(result.isBoosted).toBe(true);
      expect(result.boostType).toBe('basic');
      expect(result.expiresAt).toEqual(boost.endTime);
    });

    it('should return isBoosted: true for boosted application', async () => {
      const boost = await service.boostVisibility(
        mockUserId,
        'premium',
        'application',
        'app_456',
      );

      const result = await service.isItemBoosted('application', 'app_456');

      expect(result.isBoosted).toBe(true);
      expect(result.boostType).toBe('premium');
    });

    it('should return isBoosted: false for non-boosted item', async () => {
      const result = await service.isItemBoosted('resume', 'not_boosted_123');

      expect(result.isBoosted).toBe(false);
      expect(result.boostType).toBeUndefined();
      expect(result.expiresAt).toBeUndefined();
    });

    it('should return isBoosted: false for expired boost', async () => {
      const boost = await service.boostVisibility(
        mockUserId,
        'basic',
        'resume',
        'resume_123',
      );

      // Manually set endTime to past
      const boosts = (service as any).visibilityBoosts;
      const createdBoost = boosts.find((b: VisibilityBoost) => b.id === boost.id);
      createdBoost.endTime = new Date(Date.now() - 1000);

      const result = await service.isItemBoosted('resume', 'resume_123');

      expect(result.isBoosted).toBe(false);
    });

    it('should return isBoosted: false for cancelled boost', async () => {
      const boost = await service.boostVisibility(
        mockUserId,
        'basic',
        'resume',
        'resume_123',
      );

      await service.cancelBoost(mockUserId, boost.id);

      const result = await service.isItemBoosted('resume', 'resume_123');

      expect(result.isBoosted).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero coin credit', async () => {
      const result = await service.creditCoins(mockUserId, 0, 'Zero credit');

      expect(result.balance).toBe(0);
    });

    it('should handle very large coin amounts', async () => {
      const largeAmount = 1000000;
      const result = await service.creditCoins(mockUserId, largeAmount, 'Large credit');

      expect(result.balance).toBe(largeAmount);
    });

    it('should handle concurrent credit operations', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(service.creditCoins(mockUserId, 100, `Credit ${i}`));
      }

      await Promise.all(promises);

      const balance = await service.getBalance(mockUserId);
      expect(balance.balance).toBe(1000);
    });

    it('should handle special characters in reasons', async () => {
      await service.creditCoins(mockUserId, 100, 'Credit with special chars: @#$%^&*()');

      const transactions = await service.getTransactionHistory(mockUserId);
      expect(transactions[0].reason).toBe('Credit with special chars: @#$%^&*()');
    });

    it('should handle empty metadata object', async () => {
      await service.creditCoins(mockUserId, 100, 'Credit', {});

      const transactions = await service.getTransactionHistory(mockUserId);
      expect(transactions[0].metadata).toEqual({});
    });
  });
});
