import { describe, it, expect } from 'vitest';
import { evaluateMemberProductivity } from '@/lib/tasks/engine';

describe('Workload & Productivity Evaluator (F131) - evaluateMemberProductivity', () => {
  it('assigns 0% on-time rate and 0 score when member has 0 tasks assigned', () => {
    const result = evaluateMemberProductivity(
      'user_empty',
      'Trần Thị B',
      'tranthib@topify.vn',
      'Video Editor & CSKH',
      []
    );

    expect(result.totalAssigned).toBe(0);
    expect(result.completedCount).toBe(0);
    expect(result.overdueCount).toBe(0);
    expect(result.onTimeRate).toBe(0);
    expect(result.productivityScore).toBe(0);
    expect(result.isOverloaded).toBe(false);
  });

  it('does NOT give 100% on-time rate when member has not completed any task', () => {
    const futureDue = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString();
    const result = evaluateMemberProductivity(
      'user_1',
      'Nguyễn Văn A',
      'nguyenvana@topify.vn',
      'Content & Media Lead',
      [
        {
          assigneeId: 'user_1',
          status: 'TODO',
          dueDate: futureDue,
          priority: 'HIGH',
        },
      ]
    );

    expect(result.totalAssigned).toBe(1);
    expect(result.activeCount).toBe(1);
    expect(result.completedCount).toBe(0);
    expect(result.overdueCount).toBe(0);
    // Crucial check: cannot be 100% when 0 tasks completed
    expect(result.onTimeRate).toBe(0);
    // Productivity score reflects in-progress effort (e.g. 30), not arbitrary 70 or 50
    expect(result.productivityScore).toBe(30);
    expect(result.productivityScore).toBeGreaterThan(0);
  });

  it('calculates 100% on-time rate and 100 score when all tasks are completed on time', () => {
    const pastDue = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const result = evaluateMemberProductivity(
      'user_1',
      'Nguyễn Văn A',
      'nguyenvana@topify.vn',
      'Content & Media Lead',
      [
        {
          assigneeId: 'user_1',
          status: 'DONE',
          dueDate: pastDue,
          priority: 'MEDIUM',
        },
      ]
    );

    expect(result.totalAssigned).toBe(1);
    expect(result.completedCount).toBe(1);
    expect(result.overdueCount).toBe(0);
    expect(result.onTimeRate).toBe(100);
    expect(result.productivityScore).toBe(100);
  });

  it('calculates 50% on-time rate when 1 task completed and 1 active task overdue', () => {
    const pastDue = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const result = evaluateMemberProductivity(
      'user_1',
      'Nguyễn Văn A',
      'nguyenvana@topify.vn',
      'Content & Media Lead',
      [
        {
          assigneeId: 'user_1',
          status: 'DONE',
          dueDate: pastDue,
          priority: 'MEDIUM',
        },
        {
          assigneeId: 'user_1',
          status: 'IN_PROGRESS',
          dueDate: pastDue, // Overdue
          priority: 'HIGH',
        },
      ]
    );

    expect(result.totalAssigned).toBe(2);
    expect(result.completedCount).toBe(1);
    expect(result.overdueCount).toBe(1);
    // 1 completed / (1 completed + 1 overdue) = 50%
    expect(result.onTimeRate).toBe(50);
    expect(result.productivityScore).toBeLessThan(50);
  });

  it('detects member overload correctly when exceeding active or urgent thresholds', () => {
    const futureDue = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString();
    const result = evaluateMemberProductivity(
      'user_busy',
      'Lê Hoàng C',
      'lehoangc@topify.vn',
      'Growth & Ads Specialist',
      [
        { assigneeId: 'user_busy', status: 'IN_PROGRESS', dueDate: futureDue, priority: 'URGENT' },
        { assigneeId: 'user_busy', status: 'TODO', dueDate: futureDue, priority: 'URGENT' },
        { assigneeId: 'user_busy', status: 'REVIEW', dueDate: futureDue, priority: 'URGENT' },
      ]
    );

    expect(result.isOverloaded).toBe(true);
  });
});
