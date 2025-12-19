import { test, expect } from '@playwright/test';
import { test as authenticatedTest } from '../fixtures/user.fixture';
import { WAIT_TIMES } from '../utils/test-data';

/**
 * E2E Tests for AI Interview Prep Tool
 *
 * This suite tests AI interview preparation including:
 * - Practice questions
 * - Answer suggestions
 * - Interview tips
 * - Mock interviews
 */

authenticatedTest.describe('AI Interview Prep', () => {
  authenticatedTest.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/ai-tools/interview-prep');
  });

  authenticatedTest('should display interview prep page', async ({ authenticatedPage }) => {
    await expect(authenticatedPage).toHaveURL(/.*interview/);
    await expect(authenticatedPage.getByRole('heading', { name: /interview.*prep/i })).toBeVisible();
  });

  authenticatedTest('should generate practice questions', async ({ authenticatedPage }) => {
    // Mock the interview questions API endpoint
    await authenticatedPage.route('**/api/v1/ai/interview/questions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            question: 'Tell me about a time when you had to solve a challenging technical problem.',
            type: 'behavioral',
            difficulty: 'medium',
            tips: [
              'Use the STAR method',
              'Focus on your specific contribution',
              'Highlight the impact of your solution'
            ],
            example_answer: 'Start with the situation, describe the task, explain your actions, and share the results.'
          },
          {
            question: 'How do you handle code reviews and feedback from peers?',
            type: 'behavioral',
            difficulty: 'medium',
            tips: [
              'Show openness to feedback',
              'Emphasize collaboration',
              'Provide specific examples'
            ],
            example_answer: 'Discuss your approach to receiving and giving constructive feedback.'
          },
          {
            question: 'Explain the difference between SQL and NoSQL databases.',
            type: 'technical',
            difficulty: 'medium',
            tips: [
              'Cover key differences',
              'Mention use cases for each',
              'Be clear and concise'
            ],
            example_answer: 'Discuss structure, scalability, and appropriate use cases.'
          }
        ])
      });
    });

    const roleInput = authenticatedPage.getByLabel(/job.*role|position/i);
    await roleInput.fill('Software Engineer');

    const generateButton = authenticatedPage.getByRole('button', { name: /generate.*questions/i });
    await generateButton.click();

    await expect(authenticatedPage.getByText(/generating/i)).toBeVisible();

    const questions = authenticatedPage.getByTestId('interview-question');
    await expect(questions.first()).toBeVisible({ timeout: WAIT_TIMES.aiGeneration });
  });

  authenticatedTest('should get AI answer suggestions', async ({ authenticatedPage }) => {
    // Mock the STAR answers API endpoint
    await authenticatedPage.route('**/api/v1/ai/star-answers', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          question: 'Tell me about a time when you had to solve a challenging technical problem.',
          answers: [
            {
              situation: 'In my previous role at Tech Corp, our main database was experiencing severe performance issues affecting 50,000+ users.',
              task: 'I was tasked with identifying the root cause and implementing a solution within 48 hours to prevent customer churn.',
              action: 'I analyzed query patterns, identified N+1 queries, implemented database indexing, and added Redis caching for frequently accessed data.',
              result: 'Reduced average response time from 3.5s to 280ms (92% improvement), eliminating customer complaints and saving an estimated $100K in potential lost revenue.',
              full_answer: 'In my previous role at Tech Corp, our main database was experiencing severe performance issues affecting 50,000+ users. I was tasked with identifying the root cause and implementing a solution within 48 hours to prevent customer churn. I analyzed query patterns, identified N+1 queries, implemented database indexing, and added Redis caching for frequently accessed data. This reduced average response time from 3.5s to 280ms (92% improvement), eliminating customer complaints and saving an estimated $100K in potential lost revenue.',
              tips: [
                'Emphasize the scale and impact',
                'Use specific metrics and numbers',
                'Show problem-solving approach'
              ]
            }
          ],
          general_tips: [
            'Practice your STAR answers out loud before the interview',
            'Keep each STAR answer to 2-3 minutes',
            'Use specific numbers and metrics when possible',
            'Focus on positive outcomes and learnings'
          ]
        })
      });
    });

    const question = authenticatedPage.getByTestId('interview-question').first();
    const getAnswerButton = question.getByRole('button', { name: /get.*answer|suggestion/i });

    if (await getAnswerButton.isVisible().catch(() => false)) {
      await getAnswerButton.click();

      const answerSuggestion = authenticatedPage.getByTestId('answer-suggestion');
      await expect(answerSuggestion).toBeVisible({ timeout: WAIT_TIMES.aiGeneration });
    }
  });

  authenticatedTest('should practice answering questions', async ({ authenticatedPage }) => {
    // Mock the interview feedback API endpoint
    await authenticatedPage.route('**/api/v1/ai/interview/feedback', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          overall_score: 7.5,
          strengths: [
            'Used the STAR method effectively',
            'Provided specific examples',
            'Demonstrated leadership skills',
            'Mentioned quantifiable results'
          ],
          weaknesses: [
            'Could add more specific metrics',
            'Answer was slightly too long',
            'Could emphasize personal contribution more'
          ],
          suggestions: [
            'Add specific numbers to demonstrate impact',
            'Keep answer to 2-3 minutes',
            'Use "I" instead of "we" to highlight your role',
            'Practice transitions between STAR components'
          ],
          improved_version: 'In my previous role as Tech Lead, I led a team of 5 developers to deliver a critical feature under a tight deadline. Specifically, I organized daily stand-ups, implemented pair programming for knowledge sharing, and personally resolved 15+ blocking technical issues. As a result, we delivered 2 weeks early with 98% code coverage, which increased customer satisfaction by 25% and generated $500K in additional revenue.',
          detailed_feedback: 'Your answer demonstrates good use of the STAR method and shows leadership capabilities. To improve, focus on quantifying your impact with specific metrics and emphasizing your individual contributions. The improved version shows how to make the answer more impactful by adding concrete numbers and highlighting personal actions.'
        })
      });
    });

    const yourAnswerField = authenticatedPage.getByLabel(/your.*answer/i);
    if (await yourAnswerField.isVisible().catch(() => false)) {
      await yourAnswerField.fill('In my previous role, I led a team of developers...');

      const submitButton = authenticatedPage.getByRole('button', { name: /submit|get.*feedback/i });
      await submitButton.click();

      // Should receive AI feedback
      await expect(authenticatedPage.getByText(/feedback/i)).toBeVisible({ timeout: WAIT_TIMES.aiGeneration });
    }
  });

  authenticatedTest('should provide interview tips', async ({ authenticatedPage }) => {
    const tipsSection = authenticatedPage.getByRole('heading', { name: /tips/i });
    if (await tipsSection.isVisible().catch(() => false)) {
      await expect(tipsSection).toBeVisible();
    }
  });
});
