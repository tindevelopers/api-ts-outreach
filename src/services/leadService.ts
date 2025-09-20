import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/utils/logger';
import { GrowChiefService } from '@/integrations/GrowChiefService';
import { 
  Lead, 
  CreateLeadRequest, 
  LeadStatus, 
  ApiResponse 
} from '@/models/types';

export interface GetLeadsOptions {
  page: number;
  limit: number;
  status?: LeadStatus;
  campaignId?: string;
}

export interface GetLeadsResult {
  leads: Lead[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

class LeadService {
  private growChiefService: GrowChiefService;
  private leads: Map<string, Lead> = new Map(); // In-memory storage for demo

  constructor() {
    this.growChiefService = new GrowChiefService({
      endpoint: process.env.OUTREACH_API_ENDPOINT || 'http://localhost:8080',
      apiKey: process.env.OUTREACH_API_KEY || 'demo-key',
      timeout: 30000,
      retryAttempts: 3
    });
  }

  /**
   * Create a new lead
   */
  async createLead(campaignId: string, data: CreateLeadRequest): Promise<Lead> {
    const leadId = uuidv4();
    
    const lead: Lead = {
      id: leadId,
      campaignId,
      email: data.email,
      name: data.name,
      company: data.company,
      profileUrl: data.profileUrl,
      status: LeadStatus.PENDING,
      metadata: data.metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store lead (in production, save to database)
    this.leads.set(leadId, lead);

    logger.info('Lead created', {
      leadId,
      campaignId,
      email: lead.email,
      name: lead.name
    });

    return lead;
  }

  /**
   * Get leads with pagination and filtering
   */
  async getLeads(options: GetLeadsOptions): Promise<GetLeadsResult> {
    const { page, limit, status, campaignId } = options;
    
    // Filter leads
    let filteredLeads = Array.from(this.leads.values());

    if (campaignId) {
      filteredLeads = filteredLeads.filter(lead => lead.campaignId === campaignId);
    }

    if (status) {
      filteredLeads = filteredLeads.filter(lead => lead.status === status);
    }

    // Sort by creation date (newest first)
    filteredLeads.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Calculate pagination
    const total = filteredLeads.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const leads = filteredLeads.slice(startIndex, endIndex);

    return {
      leads,
      page,
      limit,
      total,
      totalPages
    };
  }

  /**
   * Get a specific lead by ID
   */
  async getLeadById(leadId: string): Promise<Lead | null> {
    const lead = this.leads.get(leadId);
    return lead || null;
  }

  /**
   * Update a lead
   */
  async updateLead(leadId: string, updateData: Partial<CreateLeadRequest & { status: LeadStatus }>): Promise<Lead | null> {
    const lead = this.leads.get(leadId);
    
    if (!lead) {
      return null;
    }

    // Update lead fields
    if (updateData.email !== undefined) lead.email = updateData.email;
    if (updateData.name !== undefined) lead.name = updateData.name;
    if (updateData.company !== undefined) lead.company = updateData.company;
    if (updateData.profileUrl !== undefined) lead.profileUrl = updateData.profileUrl;
    if (updateData.metadata !== undefined) lead.metadata = { ...lead.metadata, ...updateData.metadata };
    if (updateData.status !== undefined) lead.status = updateData.status;
    
    lead.updatedAt = new Date();

    // Save updated lead
    this.leads.set(leadId, lead);

    logger.info('Lead updated', {
      leadId,
      updatedFields: Object.keys(updateData)
    });

    return lead;
  }

  /**
   * Delete a lead
   */
  async deleteLead(leadId: string): Promise<boolean> {
    const lead = this.leads.get(leadId);
    
    if (!lead) {
      return false;
    }

    // Remove lead
    this.leads.delete(leadId);

    logger.info('Lead deleted', {
      leadId,
      campaignId: lead.campaignId
    });

    return true;
  }

  /**
   * Process a lead (send to GrowChief)
   */
  async processLead(leadId: string): Promise<void> {
    const lead = this.leads.get(leadId);
    
    if (!lead) {
      throw new Error('Lead not found');
    }

    if (lead.status !== LeadStatus.PENDING) {
      throw new Error(`Cannot process lead with status: ${lead.status}`);
    }

    // Update lead status
    lead.status = LeadStatus.PROCESSING;
    lead.updatedAt = new Date();
    this.leads.set(leadId, lead);

    try {
      // Send lead to GrowChief for processing
      await this.growChiefService.addLeads(lead.campaignId, [lead]);
      
      logger.info('Lead sent to GrowChief for processing', {
        leadId,
        campaignId: lead.campaignId
      });
    } catch (error) {
      // Revert status if GrowChief fails
      lead.status = LeadStatus.PENDING;
      lead.updatedAt = new Date();
      this.leads.set(leadId, lead);
      
      throw new Error(`Failed to process lead: ${error.message}`);
    }
  }

  /**
   * Get lead status from GrowChief
   */
  async getLeadStatus(leadId: string) {
    const lead = this.leads.get(leadId);
    
    if (!lead) {
      throw new Error('Lead not found');
    }

    try {
      const status = await this.growChiefService.getLeadStatus(leadId);
      return status;
    } catch (error) {
      logger.error('Failed to get lead status from GrowChief', {
        leadId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Bulk create leads
   */
  async createLeads(campaignId: string, leadsData: CreateLeadRequest[]): Promise<Lead[]> {
    const leads: Lead[] = [];
    
    for (const data of leadsData) {
      const lead = await this.createLead(campaignId, data);
      leads.push(lead);
    }

    logger.info('Bulk leads created', {
      campaignId,
      leadCount: leads.length
    });

    return leads;
  }

  /**
   * Get leads by campaign
   */
  async getLeadsByCampaign(campaignId: string, options: Omit<GetLeadsOptions, 'campaignId'>): Promise<GetLeadsResult> {
    return this.getLeads({
      ...options,
      campaignId
    });
  }
}

export const leadService = new LeadService();
