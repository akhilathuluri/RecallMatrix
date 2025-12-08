/**
 * Reminder Agent
 * 
 * Proactively notifies based on context and time
 * - Context-based reminders
 * - Time-based notifications
 * - Pattern-based suggestions
 * - Proactive alerts
 */

import { BaseAgent } from './BaseAgent';
import { AgentTask, AgentResult, AgentCapability, ToolType, ProactiveInsight } from './types';
import { createClient } from '@/lib/supabase/server';

export class ReminderAgent extends BaseAgent {
  constructor() {
    super('reminder');
  }

  getCapabilities(): AgentCapability[] {
    return [
      {
        name: 'Context Reminders',
        description: 'Generate reminders based on memory context',
        tools: ['context_reminder', 'pattern_analysis'],
        estimatedTime: 600,
      },
      {
        name: 'Time-Based Alerts',
        description: 'Create time-based notifications for memories',
        tools: ['temporal_filter', 'context_reminder'],
        estimatedTime: 500,
      },
      {
        name: 'Proactive Suggestions',
        description: 'Suggest actions based on memory patterns',
        tools: ['pattern_analysis', 'context_reminder'],
        estimatedTime: 700,
      },
    ];
  }

  canHandle(task: AgentTask): boolean {
    return task.type === 'reminder';
  }

  async execute(task: AgentTask): Promise<AgentResult> {
    const startTime = new Date();
    this.isProcessing = true;
    const reasoning: string[] = [];
    const toolsUsed: ToolType[] = [];

    try {
      this.log('Starting reminder analysis', { userId: task.userId });

      // Step 1: Fetch user's memories
      reasoning.push('Analyzing memories for reminder opportunities');
      const memories = await this.fetchUserMemories(task.userId);
      reasoning.push(`Scanned ${memories.length} memories`);

      // Step 2: Generate time-based reminders
      reasoning.push('Checking for time-sensitive memories');
      toolsUsed.push('temporal_filter', 'context_reminder');
      const timeReminders = await this.generateTimeReminders(memories);
      reasoning.push(`Created ${timeReminders.length} time-based reminders`);

      // Step 3: Generate context-based reminders
      reasoning.push('Analyzing context for proactive reminders');
      toolsUsed.push('pattern_analysis');
      const contextReminders = await this.generateContextReminders(memories);
      reasoning.push(`Generated ${contextReminders.length} context-based reminders`);

      // Step 4: Generate update suggestions
      reasoning.push('Checking for memories that may need updates');
      const updateReminders = await this.generateUpdateReminders(memories);
      reasoning.push(`Found ${updateReminders.length} memories needing updates`);

      const allReminders = [...timeReminders, ...contextReminders, ...updateReminders];
      const prioritized = this.prioritizeReminders(allReminders);

      const confidence = this.calculateReminderConfidence(allReminders.length, memories.length);

      this.isProcessing = false;
      return this.createResult(
        task,
        {
          reminders: prioritized,
          timeBasedCount: timeReminders.length,
          contextBasedCount: contextReminders.length,
          updateCount: updateReminders.length,
          totalReminders: allReminders.length,
        },
        reasoning,
        toolsUsed,
        confidence,
        startTime
      );
    } catch (error: any) {
      this.isProcessing = false;
      this.log('Reminder analysis failed', error.message);
      return this.createErrorResult(task, error.message, startTime);
    }
  }

  /**
   * Fetch user memories from database
   */
  private async fetchUserMemories(userId: string): Promise<any[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      this.log('Failed to fetch memories', error);
      return [];
    }
  }

  /**
   * Generate time-based reminders
   */
  private async generateTimeReminders(memories: any[]): Promise<ProactiveInsight[]> {
    const reminders: ProactiveInsight[] = [];
    const now = new Date();

    this.log(`Processing ${memories.length} memories for time-based reminders`);

    for (const memory of memories) {
      const content = (memory.title + ' ' + memory.content).toLowerCase();
      const originalContent = memory.title + ' ' + memory.content;

      this.log(`Checking memory: "${memory.title}" - Content: "${memory.content}"`);

      // Extract dates from content (various formats)
      const datePatterns = [
        /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/g, // DD/MM/YYYY or MM/DD/YYYY
        /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/g, // YYYY-MM-DD
        /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?[,\s]+(\d{4})/gi, // Month DD, YYYY (with ordinals)
        /(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{4})/gi, // DD Month YYYY (with ordinals)
        /(ending|expires?|expir[yi]ng|due|valid until)[:\s]+.{0,30}?(\d{1,2})(?:st|nd|rd|th)?[\/\-\s](jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2})[\/\-\s](\d{2,4})/gi,
      ];

      const extractedDates: Date[] = [];
      
      for (const pattern of datePatterns) {
        const matches = Array.from(originalContent.matchAll(pattern));
        this.log(`Pattern matches found: ${matches.length}`);
        
        for (const match of matches) {
          try {
            let dateStr = match[0];
            // Clean up date string
            dateStr = dateStr.replace(/(ending|expires?|expir[yi]ng|due|valid until)[:\s]+/gi, '').trim();
            dateStr = dateStr.replace(/(\d+)(st|nd|rd|th)/gi, '$1'); // Remove ordinals
            
            this.log(`Attempting to parse date: "${dateStr}"`);
            const parsedDate = new Date(dateStr);
            
            if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() > 2000) {
              this.log(`Successfully parsed date: ${parsedDate.toISOString()}`);
              extractedDates.push(parsedDate);
            } else {
              this.log(`Failed to parse date: "${dateStr}"`);
            }
          } catch (e) {
            this.log(`Error parsing date: ${e}`);
          }
        }
      }

      this.log(`Extracted ${extractedDates.length} valid dates from memory`);

      // Check for subscription/expiration keywords
      const expiryKeywords = ['expires', 'expiry', 'expiring', 'valid until', 'ending', 'ends'];
      const subscriptionKeywords = ['subscription', 'membership', 'license', 'plan'];
      const hasExpiry = expiryKeywords.some(keyword => content.includes(keyword));
      const isSubscription = subscriptionKeywords.some(keyword => content.includes(keyword));

      this.log(`Keywords found - hasExpiry: ${hasExpiry}, isSubscription: ${isSubscription}`);

      // Process extracted dates
      for (const date of extractedDates) {
        const daysUntil = Math.floor((date.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        
        this.log(`Date ${date.toLocaleDateString()}: ${daysUntil} days until`);
        
        if (daysUntil >= -7 && daysUntil <= 90) { // Within 90 days or expired up to 7 days ago
          let priority: 'high' | 'medium' | 'low' = 'low';
          
          if (daysUntil < 0) {
            priority = 'high'; // Already expired
          } else if (daysUntil <= 7) {
            priority = 'high'; // Expires within a week
          } else if (daysUntil <= 30) {
            priority = 'medium'; // Expires within a month
          }

          const action = daysUntil < 0 
            ? 'Item has expired - take action immediately'
            : daysUntil <= 7
            ? `Renew or cancel before ${date.toLocaleDateString()}`
            : `Plan renewal or cancellation`;

          const reminder = {
            id: `reminder_${memory.id}_date_${date.getTime()}`,
            type: 'reminder' as const,
            priority,
            title: daysUntil < 0 
              ? `⚠️ Expired: ${memory.title}`
              : `${isSubscription ? '💳 Subscription' : '📅'} Expires Soon: ${memory.title}`,
            description: daysUntil < 0
              ? `Expired ${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? '' : 's'} ago on ${date.toLocaleDateString()}`
              : `Expires in ${daysUntil} day${daysUntil === 1 ? '' : 's'} on ${date.toLocaleDateString()}`,
            memoryIds: [memory.id],
            actionable: true,
            suggestedAction: action,
            createdAt: now,
          };
          
          this.log(`Created reminder: ${reminder.title}`);
          reminders.push(reminder);
        }
      }

      // Fallback: If expiry keywords but no date found, create generic reminder
      if (hasExpiry && extractedDates.length === 0) {
        const memoryAge = now.getTime() - new Date(memory.created_at).getTime();
        const monthsOld = memoryAge / (30 * 24 * 60 * 60 * 1000);

        if (monthsOld >= 1) {
          reminders.push({
            id: `reminder_${memory.id}_expiry`,
            type: 'reminder',
            priority: monthsOld >= 6 ? 'high' : 'medium',
            title: 'Check Expiration Date',
            description: `"${memory.title}" mentions expiration (saved ${Math.floor(monthsOld)} months ago)`,
            memoryIds: [memory.id],
            actionable: true,
            suggestedAction: 'Verify if document/item has expired',
            createdAt: now,
          });
        }
      }

      // Check for renewal reminders (for subscriptions without specific dates)
      if (isSubscription && extractedDates.length === 0) {
        const memoryAge = now.getTime() - new Date(memory.created_at).getTime();
        const daysOld = memoryAge / (24 * 60 * 60 * 1000);

        if (daysOld >= 30) {
          reminders.push({
            id: `reminder_${memory.id}_renewal`,
            type: 'reminder',
            priority: 'medium',
            title: '💳 Subscription Check',
            description: `"${memory.title}" - Review subscription status`,
            memoryIds: [memory.id],
            actionable: true,
            suggestedAction: 'Check if subscription is still active and needed',
            createdAt: now,
          });
        }
      }
    }

    this.log(`Generated ${reminders.length} total time-based reminders`);
    return reminders;
  }

  /**
   * Generate context-based reminders
   */
  private async generateContextReminders(memories: any[]): Promise<ProactiveInsight[]> {
    const reminders: ProactiveInsight[] = [];

    // Group by category
    const categories: Record<string, any[]> = {};
    for (const memory of memories) {
      const category = this.inferCategory(memory.title + ' ' + memory.content);
      if (!categories[category]) categories[category] = [];
      categories[category].push(memory);
    }

    // Generate reminders for incomplete sets
    if (categories['Travel'] && categories['Travel'].length > 0) {
      const hasFlights = categories['Travel'].some(m => 
        m.content.toLowerCase().includes('flight') || m.title.toLowerCase().includes('flight')
      );
      const hasHotels = categories['Travel'].some(m => 
        m.content.toLowerCase().includes('hotel') || m.title.toLowerCase().includes('hotel')
      );

      if (hasFlights && !hasHotels) {
        reminders.push({
          id: `reminder_travel_incomplete`,
          type: 'missing_info',
          priority: 'medium',
          title: 'Travel Plans Incomplete',
          description: 'You have flight info but no hotel details saved',
          memoryIds: categories['Travel'].map(m => m.id).slice(0, 3),
          actionable: true,
          suggestedAction: 'Add hotel/accommodation details',
          createdAt: new Date(),
        });
      }
    }

    return reminders;
  }

  /**
   * Generate update reminders
   */
  private async generateUpdateReminders(memories: any[]): Promise<ProactiveInsight[]> {
    const reminders: ProactiveInsight[] = [];
    const now = new Date();

    // Check for old API keys, passwords, etc.
    const securityKeywords = ['api key', 'password', 'token', 'credential', 'access key'];

    for (const memory of memories) {
      const content = (memory.title + ' ' + memory.content).toLowerCase();
      const hasSecurity = securityKeywords.some(keyword => content.includes(keyword));

      if (hasSecurity) {
        const memoryAge = now.getTime() - new Date(memory.created_at).getTime();
        const monthsOld = memoryAge / (30 * 24 * 60 * 60 * 1000);

        if (monthsOld >= 6) {
          reminders.push({
            id: `reminder_${memory.id}_security`,
            type: 'update_needed',
            priority: 'high',
            title: 'Security Info May Be Outdated',
            description: `Memory "${memory.title}" contains security info (saved ${Math.floor(monthsOld)} months ago)`,
            memoryIds: [memory.id],
            actionable: true,
            suggestedAction: 'Verify credentials are still valid',
            createdAt: now,
          });
        }
      }
    }

    // Check for old contact information
    const contactKeywords = ['phone', 'email', 'address', 'contact'];
    for (const memory of memories) {
      const content = (memory.title + ' ' + memory.content).toLowerCase();
      const hasContact = contactKeywords.some(keyword => content.includes(keyword));

      if (hasContact) {
        const memoryAge = now.getTime() - new Date(memory.created_at).getTime();
        const monthsOld = memoryAge / (30 * 24 * 60 * 60 * 1000);

        if (monthsOld >= 12) {
          reminders.push({
            id: `reminder_${memory.id}_contact`,
            type: 'update_needed',
            priority: 'low',
            title: 'Contact Info May Be Outdated',
            description: `Memory "${memory.title}" contains contact info (saved ${Math.floor(monthsOld)} months ago)`,
            memoryIds: [memory.id],
            actionable: true,
            suggestedAction: 'Verify contact details are current',
            createdAt: now,
          });
        }
      }
    }

    return reminders;
  }

  /**
   * Prioritize reminders
   */
  private prioritizeReminders(reminders: ProactiveInsight[]): ProactiveInsight[] {
    const priorityOrder = { high: 3, medium: 2, low: 1 };

    return reminders.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // If same priority, sort by date (newer first)
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  /**
   * Infer category from text
   */
  private inferCategory(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('travel') || lower.includes('trip') || lower.includes('flight')) return 'Travel';
    if (lower.includes('work') || lower.includes('project')) return 'Work';
    if (lower.includes('health') || lower.includes('doctor')) return 'Health';
    if (lower.includes('finance') || lower.includes('bank')) return 'Finance';
    return 'Personal';
  }

  /**
   * Calculate reminder confidence
   */
  private calculateReminderConfidence(reminderCount: number, totalMemories: number): number {
    if (totalMemories === 0) return 0;

    // Higher confidence if we found actionable reminders
    const reminderRatio = reminderCount / totalMemories;
    return Math.min(0.7 + reminderRatio * 0.3, 0.95);
  }
}
