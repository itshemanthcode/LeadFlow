import { useMemo } from 'react';
import { Lead } from '@/lib/types';
import { checkSLABreach, calculateLeadScore, detectCityFromPhone, suggestBestCallWindow } from '@/lib/utils';
import { mockOwners } from '@/lib/mockData';

export function useLeadAutomations(leads: Lead[]) {
  const slaBreaches = useMemo(() => {
    return leads.filter(lead => checkSLABreach(lead));
  }, [leads]);

  const autoEnrichLead = (lead: Lead): Lead => {
    let enriched = { ...lead };
    
    // Auto-detect city from phone if not set
    if (!enriched.city || enriched.city === 'Other') {
      enriched.city = detectCityFromPhone(lead.phone);
    }
    
    // Auto-calculate score
    enriched.score = calculateLeadScore(enriched);
    
    // Set timezone based on city
    if (!enriched.timezone) {
      enriched.timezone = 'Asia/Kolkata'; // Default for Indian cities
    }
    
    return enriched;
  };

  const findDuplicates = (lead: Lead, allLeads: Lead[]): Lead[] => {
    const duplicates: Lead[] = [];
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    
    allLeads.forEach(l => {
      if (l.id === lead.id) return;
      
      // Check if created within 14 days
      if (l.createdAt < fourteenDaysAgo) return;
      
      // Fuzzy match on phone
      if (l.phone === lead.phone) {
        duplicates.push(l);
        return;
      }
      
      // Fuzzy match on email
      if (lead.email && l.email && l.email.toLowerCase() === lead.email.toLowerCase()) {
        duplicates.push(l);
        return;
      }
      
      // Fuzzy match on name (simple similarity)
      const nameSimilarity = calculateNameSimilarity(l.name, lead.name);
      if (nameSimilarity > 0.8 && l.phone.slice(-4) === lead.phone.slice(-4)) {
        duplicates.push(l);
      }
    });
    
    return duplicates;
  };

  const calculateNameSimilarity = (name1: string, name2: string): number => {
    const s1 = name1.toLowerCase().trim();
    const s2 = name2.toLowerCase().trim();
    if (s1 === s2) return 1;
    
    // Simple Levenshtein-like similarity
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    const editDistance = levenshteinDistance(s1, s2);
    
    return 1 - (editDistance / longer.length);
  };

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  const autoAssignLead = (lead: Lead, allLeads: Lead[]): string => {
    // Round-robin by city
    const cityLeads = allLeads.filter(l => l.city === lead.city);
    const owners = mockOwners.filter(o => o.role === 'Sales Executive');
    
    if (owners.length === 0) return '';
    
    // Count leads per owner for this city
    const ownerCounts = owners.map(owner => ({
      ownerId: owner.id,
      count: cityLeads.filter(l => l.owner === owner.id).length,
    }));
    
    // Find owner with least leads
    const minCount = Math.min(...ownerCounts.map(o => o.count));
    const availableOwners = ownerCounts.filter(o => o.count === minCount);
    
    // If multiple owners have same count, prefer those with matching expertise
    if (lead.preferredModel) {
      const matchingOwners = availableOwners.filter(o => {
        const owner = owners.find(own => own.id === o.ownerId);
        return owner?.expertise?.includes(lead.preferredModel || '');
      });
      
      if (matchingOwners.length > 0) {
        return matchingOwners[0].ownerId;
      }
    }
    
    return availableOwners[0].ownerId;
  };

  const getBestCallWindow = (lead: Lead): string => {
    return suggestBestCallWindow(lead.city);
  };

  return {
    slaBreaches,
    autoEnrichLead,
    findDuplicates,
    autoAssignLead,
    getBestCallWindow,
  };
}

