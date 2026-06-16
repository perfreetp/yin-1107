import { useState, useMemo } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Wand2, Plus, Trash2, Play, Eye, Check, X, Settings } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { applyBatchRules, previewBatchChanges } from '@/core/batchEngine'
import { FIELD_LABELS, type FieldType, type BatchReplaceRule } from '@/types'

const ALL_FIELDS: FieldType[] = [
  'itemName', 'itemCode', 'department', 'acceptConditions', 'materials',
  'processSteps', 'specialProcedures', 'timeLimit', 'feeStandard',
  'handlingLocation', 'onlineUrl', 'consultPhone'
]

export function BatchWorkspace() {
  const { state, updateBatchRule, removeBatchRule, addBatchRule, applyBatchRules: storeApplyBatchRules } = useApp()
  const [showPreview, setShowPreview] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newRule, setNewRule] = useState<Partial<BatchReplaceRule>>({
    name: '',
    pattern: '',
    replacement: '',
    isRegex: false,
    targetFields: ['materials'],
    enabled: true
  })

  const previewChanges = useMemo(() => {
    if (!showPreview) return []
    return previewBatchChanges(state.items, state.batchRules)
  }, [state.items, state.batchRules, showPreview])

  const handleToggleRule = (ruleId: string, enabled: boolean) => {
    updateBatchRule(ruleId, { enabled })
  }

  const handleDeleteRule = (ruleId: string) => {
    removeBatchRule(ruleId)
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
      enabled: true
    }
    
    addBatchRule(rule)
    setShowAddModal(false)
    setNewRule({
      name: '',
      pattern: '',
      replacement: '',
      isRegex: false,
      targetFields: ['materials'],
      enabled: true
    })
  }

  const handleApplyRules = () => {
    if (state.batchRules.filter(r => r.enabled).length === 0) {
      alert('请至少启用一个替换规则')
      return
    }
    
    const { items: updatedItems, changes } = applyBatchRules(state.items, state.batchRules.filter(r => r.enabled))
    storeApplyBatchRules(updatedItems, changes)
    
    alert(`已应用 ${changes.length} 处替换`)
    setShowPreview(false)
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
          <div className="flex items-center gap-3">
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
              <span className="text-amber-600">
                预计将产生 {previewChanges.length} 处变更
              </span>
            </>
          )}
        </div>
      </div>

      {showPreview && previewChanges.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 p-4">
          <h3 className="text-sm font-semibold text-amber-800 mb-2">变更预览</h3>
          <div className="max-h-40 overflow-auto space-y-1">
            {previewChanges.slice(0, 20).map((change, index) => (
              <div
                key={index}
                className="flex items-start gap-3 text-xs bg-white rounded p-2 border border-amber-200"
              >
                <span className="text-gray-500 w-40 shrink-0 truncate">
                  {change.itemName}
                </span>
                <span className="text-gray-400 shrink-0">
                  {FIELD_LABELS[change.field]}
                </span>
                <span className="text-red-600 line-through flex-1 truncate">
                  {change.oldValue}
                </span>
                <span className="text-gray-400">→</span>
                <span className="text-green-600 flex-1 truncate">
                  {change.newValue}
                </span>
              </div>
            ))}
            {previewChanges.length > 20 && (
              <div className="text-xs text-amber-600 text-center">
                ... 还有 {previewChanges.length - 20} 处变更
              </div>
            )}
          </div>
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
                      className={`w-10 h-6 rounded-full transition-colors relative ${
                        rule.enabled ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          rule.enabled ? 'left-4.5' : 'left-0.5'
                        }`}
                        style={{
                          transform: rule.enabled ? 'translateX(18px)' : 'translateX(2px)'
                        }}
                      />
                    </button>
                    <div>
                      <h3 className="font-medium text-gray-800">{rule.name}</h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <code className="bg-gray-100 px-2 py-0.5 rounded text-red-600">
                          {rule.pattern}
                        </code>
                        <span className="text-gray-400">→</span>
                        <code className="bg-gray-100 px-2 py-0.5 rounded text-green-600">
                          {rule.replacement || '(空)'}
                        </code>
                        {rule.isRegex && (
                          <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                            正则
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
                          : 'bg-gray-100 text-gray-400 border border-gray-200'
                      }`}
                    >
                      {FIELD_LABELS[field]}
                    </button>
                  ))}
                </div>
              </div>
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">添加替换规则</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
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
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRegex"
                  checked={newRule.isRegex}
                  onChange={e => setNewRule(prev => ({ ...prev, isRegex: e.target.checked }))}
                  className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                />
                <label htmlFor="isRegex" className="text-sm text-gray-700">
                  使用正则表达式
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
                          : 'bg-gray-100 text-gray-500 border border-gray-200'
                      }`}
                    >
                      {FIELD_LABELS[field]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
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
