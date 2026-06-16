import { useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type {
  AppState,
  ItemRecord,
  ImportSource,
  Issue,
  BatchReplaceRule,
  WorkspaceType,
  IssueType,
  IssueSeverity,
  BatchChangeRecord
} from '@/types'
import { DEFAULT_BATCH_RULES } from '@/core/batchEngine'
import { detectIssuesForItems } from '@/core/issueDetector'
import { generateDemoData } from '@/data/demoData'

const initialState: AppState = {
  sources: [],
  items: [],
  selectedItemId: null,
  compareItemIds: null,
  issues: [],
  batchRules: [...DEFAULT_BATCH_RULES],
  batchHistory: [],
  currentWorkspace: 'import',
  filterType: 'all',
  filterDepartment: '',
  filterSeverity: 'all'
}

export function useAppStore() {
  const [state, setState] = useState<AppState>(initialState)

  const setCurrentWorkspace = useCallback((workspace: WorkspaceType) => {
    setState(prev => ({ ...prev, currentWorkspace: workspace }))
  }, [])

  const addSource = useCallback((source: ImportSource, items: ItemRecord[]) => {
    setState(prev => ({
      ...prev,
      sources: [...prev.sources, source],
      items: [...prev.items, ...items]
    }))
  }, [])

  const removeSource = useCallback((sourceId: string) => {
    setState(prev => {
      const remainingItems = prev.items.filter(item => item.sourceId !== sourceId)
      const remainingIssues = prev.issues.filter(issue => 
        remainingItems.some(item => item.id === issue.itemId)
      )
      return {
        ...prev,
        sources: prev.sources.filter(s => s.id !== sourceId),
        items: remainingItems,
        issues: remainingIssues,
        selectedItemId: remainingItems.some(i => i.id === prev.selectedItemId) ? prev.selectedItemId : null,
        compareItemIds: prev.compareItemIds && 
          remainingItems.some(i => i.id === prev.compareItemIds![0]) &&
          remainingItems.some(i => i.id === prev.compareItemIds![1])
          ? prev.compareItemIds
          : null
      }
    })
  }, [])

  const selectItem = useCallback((itemId: string | null) => {
    setState(prev => ({ ...prev, selectedItemId: itemId }))
  }, [])

  const setCompareItems = useCallback((itemIds: [string, string] | null) => {
    setState(prev => ({ ...prev, compareItemIds: itemIds }))
  }, [])

  const runDetection = useCallback(() => {
    setState(prev => {
      const newIssues = detectIssuesForItems(prev.items)
      return {
        ...prev,
        issues: newIssues
      }
    })
  }, [])

  const updateIssueStatus = useCallback((issueId: string, status: Issue['status']) => {
    setState(prev => ({
      ...prev,
      issues: prev.issues.map(issue =>
        issue.id === issueId
          ? { ...issue, status, resolveTime: status === 'resolved' ? Date.now() : undefined }
          : issue
      )
    }))
  }, [])

  const batchUpdateIssueStatus = useCallback((issueIds: string[], status: Issue['status']) => {
    setState(prev => ({
      ...prev,
      issues: prev.issues.map(issue =>
        issueIds.includes(issue.id)
          ? { ...issue, status, resolveTime: status === 'resolved' ? Date.now() : undefined }
          : issue
      )
    }))
  }, [])

  const addBatchRule = useCallback((rule: BatchReplaceRule) => {
    setState(prev => ({
      ...prev,
      batchRules: [...prev.batchRules, rule]
    }))
  }, [])

  const updateBatchRule = useCallback((ruleId: string, updates: Partial<BatchReplaceRule>) => {
    setState(prev => ({
      ...prev,
      batchRules: prev.batchRules.map(rule =>
        rule.id === ruleId ? { ...rule, ...updates } : rule
      )
    }))
  }, [])

  const removeBatchRule = useCallback((ruleId: string) => {
    setState(prev => ({
      ...prev,
      batchRules: prev.batchRules.filter(rule => rule.id !== ruleId)
    }))
  }, [])

  const applyBatchRules = useCallback((updatedItems: ItemRecord[], changes: Array<{ itemId: string; itemName: string; field: any; oldValue: string; newValue: string }>) => {
    setState(prev => {
      const affectedItemIds = [...new Set(changes.map(c => c.itemId))]
      const itemSnapshots = prev.items.filter(item => affectedItemIds.includes(item.id))
      const enabledRuleIds = prev.batchRules.filter(r => r.enabled).map(r => r.id)
      
      const historyRecord: BatchChangeRecord = {
        id: uuidv4(),
        timestamp: Date.now(),
        ruleIds: enabledRuleIds,
        changes,
        itemSnapshots
      }
      
      return {
        ...prev,
        items: updatedItems,
        batchHistory: [historyRecord, ...prev.batchHistory].slice(0, 20)
      }
    })
    
    if (changes.length > 0) {
      runDetection()
    }
  }, [runDetection])

  const undoLastBatch = useCallback(() => {
    setState(prev => {
      if (prev.batchHistory.length === 0) return prev
      
      const [lastChange, ...restHistory] = prev.batchHistory
      const updatedItems = [...prev.items]
      
      for (const snapshot of lastChange.itemSnapshots) {
        const index = updatedItems.findIndex(i => i.id === snapshot.id)
        if (index !== -1) {
          updatedItems[index] = snapshot
        }
      }
      
      return {
        ...prev,
        items: updatedItems,
        batchHistory: restHistory
      }
    })
    
    runDetection()
  }, [runDetection])

  const updateItem = useCallback((itemId: string, updates: Partial<ItemRecord>) => {
    setState(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    }))
  }, [])

  const setFilterType = useCallback((filterType: IssueType | 'all') => {
    setState(prev => ({ ...prev, filterType }))
  }, [])

  const setFilterDepartment = useCallback((filterDepartment: string) => {
    setState(prev => ({ ...prev, filterDepartment }))
  }, [])

  const setFilterSeverity = useCallback((filterSeverity: IssueSeverity | 'all') => {
    setState(prev => ({ ...prev, filterSeverity }))
  }, [])

  const loadDemoData = useCallback(() => {
    const { source, items } = generateDemoData()
    const issues = detectIssuesForItems(items)
    setState(prev => ({
      ...prev,
      sources: [...prev.sources, source],
      items: [...prev.items, ...items],
      issues: [...prev.issues, ...issues]
    }))
  }, [])

  const clearAll = useCallback(() => {
    setState(initialState)
  }, [])

  const getFilteredIssues = useCallback(() => {
    return state.issues.filter(issue => {
      if (state.filterType !== 'all' && issue.type !== state.filterType) return false
      if (state.filterSeverity !== 'all' && issue.severity !== state.filterSeverity) return false
      if (state.filterDepartment) {
        const item = state.items.find(i => i.id === issue.itemId)
        if (item?.department !== state.filterDepartment) return false
      }
      return true
    })
  }, [state.issues, state.filterType, state.filterSeverity, state.filterDepartment, state.items])

  const getDepartments = useCallback(() => {
    return [...new Set(state.items.map(i => i.department).filter(Boolean))]
  }, [state.items])

  return {
    state,
    setCurrentWorkspace,
    addSource,
    removeSource,
    selectItem,
    setCompareItems,
    runDetection,
    updateIssueStatus,
    batchUpdateIssueStatus,
    addBatchRule,
    updateBatchRule,
    removeBatchRule,
    applyBatchRules,
    undoLastBatch,
    updateItem,
    setFilterType,
    setFilterDepartment,
    setFilterSeverity,
    loadDemoData,
    clearAll,
    getFilteredIssues,
    getDepartments
  }
}

export type AppStore = ReturnType<typeof useAppStore>
