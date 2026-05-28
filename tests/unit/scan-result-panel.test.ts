import type { ContractScanResult } from '~/types/contract-scan'
// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ScanResultPanel from '../../components/contract/ScanResultPanel.vue'

function sampleResult(): ContractScanResult {
  return {
    language: 'English',
    jurisdiction: 'United States',
    overallRiskScore: { score: 'high', reason: 'Multiple one-sided terms.' },
    summary: 'Risky agreement.',
    narrowPoints: ['Point A'],
    hiddenRisks: ['Hidden B'],
    missingProtections: ['Missing C'],
    questionsToClarify: ['Question D'],
    creatorNegotiationPriorities: [
      { priority: 'Payment terms', whyItMatters: 'Cashflow risk', fallbackPosition: 'Net-15' },
    ],
    redFlags: [
      {
        title: 'Low Risk Item',
        severity: 'low',
        clauseQuote: 'low quote',
        riskType: 'other',
        whyRisky: 'low',
        creatorImpact: 'low',
        suggestion: 'low',
      },
      {
        title: 'High Risk Item',
        severity: 'high',
        clauseQuote: 'high quote',
        riskType: 'payment',
        whyRisky: 'high',
        creatorImpact: 'high',
        suggestion: 'high',
      },
      {
        title: 'Medium Risk Item',
        severity: 'medium',
        clauseQuote: 'medium quote',
        riskType: 'liability',
        whyRisky: 'medium',
        creatorImpact: 'medium',
        suggestion: 'medium',
      },
    ],
  }
}

describe('scanResultPanel', () => {
  it('sorts red flags by severity high -> medium -> low', () => {
    const wrapper = mount(ScanResultPanel, {
      props: { result: sampleResult() },
      global: {
        stubs: {
          Icon: true,
        },
      },
    })

    const html = wrapper.html()
    const highPos = html.indexOf('High Risk Item')
    const mediumPos = html.indexOf('Medium Risk Item')
    const lowPos = html.indexOf('Low Risk Item')

    expect(highPos).toBeGreaterThan(-1)
    expect(mediumPos).toBeGreaterThan(-1)
    expect(lowPos).toBeGreaterThan(-1)
    expect(highPos).toBeLessThan(mediumPos)
    expect(mediumPos).toBeLessThan(lowPos)
  })

  it('shows jurisdiction flag for US', () => {
    const wrapper = mount(ScanResultPanel, {
      props: { result: sampleResult() },
      global: {
        stubs: {
          Icon: true,
        },
      },
    })

    expect(wrapper.text()).toContain('🇺🇸')
  })
})
