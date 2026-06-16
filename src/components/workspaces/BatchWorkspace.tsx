import { useState, useMemo } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { 
  Wand2, Plus, Trash2, Play, Eye, Check, X, Settings, 
  Undo2, History, ChevronDown, ChevronUp, Sparkles, 
  ListFilter, Zap
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { applyBatchRules, previewBatchChanges, testRuleReplace } from '@/core/batchEngine'
import { FIELD_LABELS, type FieldType, type BatchReplaceRule } from '@/types'

const ALL_FIELDS: FieldType[] = [
  'itemName', 'itemCode', 'department', 'acceptConditions', 'materials',
  'processSteps', 'specialProcedures', 'timeLimit', 'feeStandard',
  'handlingLocation', 'onlineUrl', 'consultPhone'
]

export function BatchWorkspace() {
  const { state, updateBatchRule, removeBatchRule, addBatchRule, 
    applyBatchRules: storeApplyBatchRules, undoLastBatch } = useApp()
  
  const [showPreview, setShowPreview] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [previewExpanded, setPreviewExpanded] = useState(false)
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null)
  
  const [newRule, setNewRule] = useState<Partial<BatchReplaceRule>>({
    name: '',
    pattern: '',
    replacement: '',
    isRegex: false,
    targetFields: ['materials'],
    enabled: true,
    whitelist: []
  })
  const [newWhitelistItem, setNewWhitelistItem] = useState('')
  const [testText, setTestText] = useState('请输入测试文字，例如：居民身份证、身份证复印件')
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null)
  const [editWhitelistItem, setEditWhitelistItem] = useState('')

  const previewChanges = useMemo(() => {
    if (!showPreview) return []
    return previewBatchChanges(state.items, state.batchRules)
  }, [state.items, state.batchRules, showPreview])

  const testResult = useMemo(() => {
    if (!newRule.pattern) return testText
    try {
      const testRule: BatchReplaceRule = {
        id: 'test-rule',
        name: newRule.name || '测试规则',
        pattern: newRule.pattern,
        replacement: newRule.replacement || '',
        isRegex: newRule.isRegex || false,
        targetFields: newRule.targetFields || [],
        enabled: true,
        whitelist: newRule.whitelist || []
      }
      return testRuleReplace(testText, testRule)
    } catch {
      return testText
    }
  }, [testText, newRule.pattern, newRule.replacement, newRule.isRegex, newRule.whitelist])

  const handleToggleRule = (ruleId: string, enabled: boolean) => {
    updateBatchRule(ruleId, { enabled })
  }

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('确定要删除这条规则吗？')) {
      removeBatchRule(ruleId)
    }
  }

  const handleAddRule = () => {
    if (!newRule.name || !newRule.pattern) {
      alert('请填写规则名称和匹配模式')
      return
    }
    
    const rule: BatchReplaceRule = {
      id: uuidv4(),
      name: newRule.name,
      pattern: newRule.pattern,
      replacement: newRule.replacement || '',
      isRegex: newRule.isRegex || false,
      targetFields: newRule.targetFields || [],
      enabled: true,
      whitelist: newRule.whitelist || []
    }
    
    addBatchRule(rule)
    setShowAddModal(false)
    setNewRule({
      name: '',
      pattern: '',
      replacement: '',
      isRegex: false,
      targetFields: ['materials'],
      enabled: true,
      whitelist: []
    })
  }

  const handleAddWhitelistItem = () => {
    if (!newWhitelistItem.trim()) return
    setNewRule(prev => ({
      ...prev,
      whitelist: [...(prev.whitelist || []), newWhitelistItem.trim()]
    }))
    setNewWhitelistItem('')
  }

  const handleRemoveWhitelistItem = (index: number) => {
    setNewRule(prev => ({
      ...prev,
      whitelist: (prev.whitelist || []).filter((_, i) => i !== index)
    }))
  }

  const handleRuleAddWhitelist = (ruleId: string) => {
    if (!editWhitelistItem.trim()) return
    const rule = state.batchRules.find(r => r.id === ruleId)
    if (!rule) return
    updateBatchRule(ruleId, {
      whitelist: [...rule.whitelist, editWhitelistItem.trim()]
    })
    setEditWhitelistItem('')
  }

  const handleRuleRemoveWhitelist = (ruleId: string, index: number) => {
    const rule = state.batchRules.find(r => r.id === ruleId)
    if (!rule) return
    updateBatchRule(ruleId, {
      whitelist: rule.whitelist.filter((_, i) => i !== index)
    })
  }

  const handleApplyRules = () => {
    if (state.batchRules.filter(r => r.enabled).length === 0) {
      alert('请至少启用一个替换规则')
      return
    }
    
    const { items: updatedItems, changes } = applyBatchRules(
      state.items, 
      state.batchRules.filter(r => r.enabled)
    )
    
    if (changes.length === 0) {
      alert('没有匹配到可替换的内容')
      return
    }
    
    if (confirm(`确定要应用 ${changes.length} 处替换吗？`)) {
      storeApplyBatchRules(updatedItems, changes)
      alert(`已应用 ${changes.length} 处替换`)
      setShowPreview(false)
    }
  }

  const handleUndo = () => {
    if (state.batchHistory.length === 0) return
    const lastChange = state.batchHistory[0]
    if (confirm(`确定要撤销上一批替换吗？将还原 ${lastChange.changes.length} 处变更`)) {
      undoLastBatch()
      alert('已撤销上一批替换')
    }
  }

  const handleToggleField = (ruleId: string, field: FieldType) => {
    const rule = state.batchRules.find(r => r.id === ruleId)
    if (!rule) return
    
    const newTargetFields = rule.targetFields.includes(field)
      ? rule.targetFields.filter(f => f !== field)
      : [...rule.targetFields, field]
    
    updateBatchRule(ruleId, { targetFields: newTargetFields })
  }

  const handleNewRuleToggleField = (field: FieldType) => {
    setNewRule(prev => ({
      ...prev,
      targetFields: prev.targetFields?.includes(field)
        ? prev.targetFields.filter(f => f !== field)
        : [...(prev.targetFields || []), field]
    }))
  }

  const displayedPreviewChanges = previewExpanded 
    ? previewChanges 
    : previewChanges.slice(0, 20)

  if (state.items.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400">
        <Wand2 className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg">暂无数据</p>
        <p className="text-sm mt-2">请先在导入区导入事项数据</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">批量处理</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                showHistory
                  ? 'bg-purple-100 text-purple-700 border border-purple-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <History className="w-4 h-4" />
              历史记录
              {state.batchHistory.length > 0 && (
                <span className="px-1.5 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                  {state.batchHistory.length}
                </span>
              )}
            </button>
            {state.batchHistory.length > 0 && (
              <button
                onClick={handleUndo}
                className="flex items-center gap-2 px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-sm transition-colors border border-amber-300"
              >
                <Undo2 className="w-4 h-4" />
                撤销
              </button>
            )}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                showPreview
                  ? 'bg-amber-100 text-amber-700 border border-amber-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Eye className="w-4 h-4" />
              {showPreview ? '隐藏预览' : '预览变更'}
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加规则
            </button>
            <button
              onClick={handleApplyRules}
              disabled={state.batchRules.filter(r => r.enabled).length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                state.batchRules.filter(r => r.enabled).length > 0
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Play className="w-4 h-4" />
              应用替换
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>共 {state.batchRules.length} 条规则，已启用 {state.batchRules.filter(r => r.enabled).length} 条</span>
          <span>·</span>
          <span>将应用于 {state.items.length} 个事项</span>
          {showPreview && previewChanges.length > 0 && (
            <>
              <span>·</span>
              <span className="text-amber-600 font-medium">
                预计将产生 {previewChanges.length} 处变更
              </span>
            </>
          )}
        </div>
      </div>

      {showHistory && state.batchHistory.length > 0 && (
        <div className="bg-purple-50 border-b border-purple-200 p-4">
          <h3 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
            <History className="w-4 h-4" />
            替换历史（最近20条）
          </h3>
          <div className="space-y-2 max-h-48 overflow-auto">
            {state.batchHistory.map((record, index) => (
              <div
                key={record.id}
                className="flex items-center justify-between bg-white rounded-lg p-3 border border-purple-200"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-gray-800">
                      第 {index + 1} 批替换
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(record.timestamp).toLocaleString()} · {record.changes.length} 处变更
                    </div>
                  </div>
                </div>
                {index === 0 && (
                  <button
                    onClick={handleUndo}
                    className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition-colors"
                  >
                    撤销此批
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showPreview && previewChanges.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              变更预览（共 {previewChanges.length} 处）
            </h3>
            <button
              onClick={() => setPreviewExpanded(!previewExpanded)}
              className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1"
            >
              {previewExpanded ? (
                <><ChevronUp className="w-3 h-3" /> 收起</>
              ) : (
                <><ChevronDown className="w-3 h-3" /> 展开全部</>
              )}
            </button>
          </div>
          <div className={`space-y-1 ${previewExpanded ? 'max-h-96' : 'max-h-40'} overflow-auto`}>
            {displayedPreviewChanges.map((change, index) => (
              <div
                key={index}
                className="flex items-start gap-3 text-xs bg-white rounded p-2 border border-amber-200"
              >
                <span className="text-gray-500 w-32 shrink-0 truncate font-medium">
                  {change.itemName}
                </span>
                <span className="text-gray-400 shrink-0 bg-gray-100 px-1.5 py-0.5 rounded">
                  {FIELD_LABELS[change.field]}
                </span>
                <span className="text-red-600 line-through flex-1 truncate">
                  {change.oldValue}
                </span>
                <span className="text-gray-400 shrink-0">→</span>
                <span className="text-green-600 flex-1 truncate font-medium">
                  {change.newValue}
                </span>
              </div>
            ))}
          </div>
          {!previewExpanded && previewChanges.length > 20 && (
            <div className="text-xs text-amber-600 text-center mt-2">
              ... 还有 {previewChanges.length - 20} 处变更，点击"展开全部"查看
            </div>
          )}
        </div>
      )}

      {showPreview && previewChanges.length === 0 && state.batchRules.filter(r => r.enabled).length > 0 && (
        <div className="bg-green-50 border-b border-green-200 p-4">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <Check className="w-4 h-4" />
            <span>当前启用的规则未匹配到可替换的内容</span>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-4 bg-gray-50">
        <div className="space-y-3">
          {state.batchRules.map(rule => (
            <div
              key={rule.id}
              className={`bg-white rounded-lg border transition-all ${
                rule.enabled ? 'border-gray-200' : 'border-gray-200 opacity-60'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleRule(rule.id, !rule.enabled)}
                      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                        rule.enabled ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          rule.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-800">{rule.name}</h3>
                        {rule.whitelist && rule.whitelist.length > 0 && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                            {rule.whitelist.length} 个白名单
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <code className="bg-gray-100 px-2 py-0.5 rounded text-red-600 font-mono">
                          {rule.pattern}
                        </code>
                        <span className="text-gray-400">→</span>
                        <code className="bg-gray-100 px-2 py-0.5 rounded text-green-600 font-mono">
                          {rule.replacement || '(空)'}
                        </code>
                        {rule.isRegex && (
                          <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                            正则
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setExpandedRuleId(expandedRuleId === rule.id ? null : rule.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        expandedRuleId === rule.id
                          ? 'bg-blue-100 text-blue-600'
                          : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                      title="编辑白名单"
                    >
                      <ListFilter className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  <span className="text-xs text-gray-500 mr-1">作用字段：</span>
                  {ALL_FIELDS.map(field => (
                    <button
                      key={field}
                      onClick={() => handleToggleField(rule.id, field)}
                      className={`px-2 py-0.5 rounded text-xs transition-colors ${
                        rule.targetFields.includes(field)
                          ? 'bg-primary-100 text-primary-700 border border-primary-300'
                          : 'bg-gray-100 text-gray-400 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {FIELD_LABELS[field]}
                    </button>
                  ))}
                </div>
              </div>

              {expandedRuleId === rule.id && (
                <div className="border-t border-gray-100 bg-gray-50 p-4">
                  <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    白名单关键词（匹配到这些词时不替换）
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {rule.whitelist.length === 0 ? (
                      <span className="text-xs text-gray-400">暂无白名单，添加后可以保护特定词汇不被替换</span>
                    ) : (
                      rule.whitelist.map((item, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                        >
                          {item}
                          <button
                            onClick={() => handleRuleRemoveWhitelist(rule.id, index)}
                            className="hover:text-blue-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingRuleId === rule.id ? editWhitelistItem : ''}
                      onChange={e => {
                        setEditingRuleId(rule.id)
                        setEditWhitelistItem(e.target.value)
                      }}
                      onFocus={() => setEditingRuleId(rule.id)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          handleRuleAddWhitelist(rule.id)
                        }
                      }}
                      placeholder="输入白名单关键词，按回车添加"
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    />
                    <button
                      onClick={() => handleRuleAddWhitelist(rule.id)}
                      className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                    >
                      添加
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {state.batchRules.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg">暂无批量替换规则</p>
              <p className="text-sm mt-1">点击"添加规则"创建新的替换规则</p>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-800">添加替换规则</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4 overflow-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  规则名称
                </label>
                <input
                  type="text"
                  value={newRule.name}
                  onChange={e => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="例如：身份证 → 身份证明"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    匹配模式
                  </label>
                  <input
                    type="text"
                    value={newRule.pattern}
                    onChange={e => setNewRule(prev => ({ ...prev, pattern: e.target.value }))}
                    placeholder="要查找的文本"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    替换为
                  </label>
                  <input
                    type="text"
                    value={newRule.replacement}
                    onChange={e => setNewRule(prev => ({ ...prev, replacement: e.target.value }))}
                    placeholder="替换后的文本"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none font-mono text-sm"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    id="isRegex"
                    checked={newRule.isRegex}
                    onChange={e => setNewRule(prev => ({ ...prev, isRegex: e.target.checked }))}
                    className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">使用正则表达式</span>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  作用字段
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_FIELDS.map(field => (
                    <button
                      key={field}
                      onClick={() => handleNewRuleToggleField(field)}
                      className={`px-3 py-1 rounded-full text-xs transition-colors ${
                        newRule.targetFields?.includes(field)
                          ? 'bg-primary-100 text-primary-700 border border-primary-300'
                          : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {FIELD_LABELS[field]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <ListFilter className="w-4 h-4 text-blue-500" />
                  白名单（可选）
                  <span className="text-xs text-gray-400 font-normal">
                    - 匹配到这些词时不进行替换
                  </span>
                </label>
                <div className="flex flex-wrap gap-2 mb-2 min-h-[28px]">
                  {newRule.whitelist?.length === 0 ? (
                    <span className="text-xs text-gray-400">暂无白名单</span>
                  ) : (
                    newRule.whitelist?.map((item, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                      >
                        {item}
                        <button
                          onClick={() => handleRemoveWhitelistItem(index)}
                          className="hover:text-blue-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newWhitelistItem}
                    onChange={e => setNewWhitelistItem(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        handleAddWhitelistItem()
                      }
                    }}
                    placeholder="输入白名单关键词，例如：居民身份证，按回车添加"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <button
                    onClick={handleAddWhitelistItem}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                  >
                    添加
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  即时试跑
                  <span className="text-xs text-gray-400 font-normal">- 输入测试文字，实时查看替换效果</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">测试输入：</label>
                    <textarea
                      value={testText}
                      onChange={e => setTestText(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">替换结果：</label>
                    <div className="w-full px-3 py-2 bg-white border border-green-300 rounded-lg text-sm font-mono min-h-[52px] text-green-700">
                      {testResult || <span className="text-gray-400">无内容</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddRule}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm transition-colors"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
