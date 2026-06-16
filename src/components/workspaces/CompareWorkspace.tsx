import { useState, useMemo } from 'react'
import { GitCompare, ChevronLeft, ChevronRight, Check, X, ArrowRightLeft, FileCode, AlertTriangle } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { compareItems, findMatchedItems, getFieldValue } from '@/core/diffEngine'
import { DiffHighlight } from '@/components/common/DiffHighlight'
import { FIELD_LABELS, type FieldType } from '@/types'

const ALL_FIELDS: FieldType[] = [
  'itemName', 'itemCode', 'department', 'acceptConditions', 'materials',
  'processSteps', 'specialProcedures', 'timeLimit', 'feeStandard',
  'handlingLocation', 'onlineUrl', 'consultPhone'
]

export function CompareWorkspace() {
  const { state, setCompareItems } = useApp()
  const [selectedFields, setSelectedFields] = useState<FieldType[]>(ALL_FIELDS)
  const [autoMatchMode, setAutoMatchMode] = useState(false)

  const matchedPairs = useMemo(() => {
    if (!autoMatchMode) return []
    const sources = [...new Set(state.items.map(i => i.sourceId))]
    if (sources.length < 2) return []
    
    const source1Items = state.items.filter(i => i.sourceId === sources[0])
    const source2Items = state.items.filter(i => i.sourceId === sources[1])
    
    return findMatchedItems(source1Items, source2Items)
  }, [state.items, autoMatchMode])

  const [leftItem, rightItem] = useMemo(() => {
    if (state.compareItemIds) {
      return [
        state.items.find(i => i.id === state.compareItemIds![0]) || null,
        state.items.find(i => i.id === state.compareItemIds![1]) || null
      ]
    }
    return [null, null]
  }, [state.compareItemIds, state.items])

  const comparisonResult = useMemo(() => {
    if (!leftItem || !rightItem) return null
    return compareItems(leftItem, rightItem, selectedFields)
  }, [leftItem, rightItem, selectedFields])

  const [selectedPairIndex, setSelectedPairIndex] = useState(0)

  const handleAutoMatch = () => {
    setAutoMatchMode(true)
    if (matchedPairs.length > 0) {
      setCompareItems([matchedPairs[0][0].id, matchedPairs[0][1].id])
      setSelectedPairIndex(0)
    }
  }

  const handleSelectPair = (index: number) => {
    setSelectedPairIndex(index)
    setCompareItems([matchedPairs[index][0].id, matchedPairs[index][1].id])
  }

  const handleSelectSingle = (side: 'left' | 'right', itemId: string) => {
    if (state.compareItemIds) {
      if (side === 'left') {
        setCompareItems([itemId, state.compareItemIds[1]])
      } else {
        setCompareItems([state.compareItemIds[0], itemId])
      }
    } else {
      const otherItems = state.items.filter(i => i.id !== itemId)
      if (otherItems.length > 0) {
        setCompareItems(side === 'left' ? [itemId, otherItems[0].id] : [otherItems[0].id, itemId])
      }
    }
  }

  const sources = [...new Set(state.items.map(i => i.sourceId))]

  const toggleField = (field: FieldType) => {
    setSelectedFields(prev => 
      prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field]
    )
  }

  if (state.items.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400">
        <GitCompare className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg">暂无数据</p>
        <p className="text-sm mt-2">请先在导入区导入事项数据</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">双栏比对</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleAutoMatch}
              disabled={sources.length < 2}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                sources.length >= 2
                  ? 'bg-primary-600 hover:bg-primary-700 text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              自动匹配相同事项
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600 mr-2">比对字段：</span>
          {ALL_FIELDS.map(field => (
            <button
              key={field}
              onClick={() => toggleField(field)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedFields.includes(field)
                  ? 'bg-primary-100 text-primary-700 border border-primary-300'
                  : 'bg-gray-100 text-gray-500 border border-gray-200'
              }`}
            >
              {FIELD_LABELS[field]}
            </button>
          ))}
        </div>
      </div>

      {autoMatchMode && matchedPairs.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 p-3">
          <div className="flex items-center gap-4 overflow-x-auto">
            <span className="text-sm font-medium text-blue-700 whitespace-nowrap">
              已匹配 {matchedPairs.length} 对事项：
            </span>
            <div className="flex gap-2">
              {matchedPairs.map((pair, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectPair(index)}
                  className={`whitespace-nowrap px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    index === selectedPairIndex
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  {pair[0].itemName}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 border-r border-gray-200 bg-gray-50 overflow-auto">
          <div className="p-3 border-b border-gray-200 bg-white">
            <h3 className="text-sm font-semibold text-gray-700">事项列表</h3>
            <p className="text-xs text-gray-500 mt-1">点击选择要比对的事项</p>
          </div>
          <div className="p-2">
            {state.items.map(item => (
              <div
                key={item.id}
                className={`p-2 rounded-lg mb-1 cursor-pointer transition-colors ${
                  state.compareItemIds?.[0] === item.id
                    ? 'bg-blue-100 border border-blue-300'
                    : state.compareItemIds?.[1] === item.id
                    ? 'bg-green-100 border border-green-300'
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800 truncate">{item.itemName}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleSelectSingle('left', item.id)}
                      className={`p-1 rounded ${
                        state.compareItemIds?.[0] === item.id
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-400 hover:text-blue-600'
                      }`}
                      title="设为左栏"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleSelectSingle('right', item.id)}
                      className={`p-1 rounded ${
                        state.compareItemIds?.[1] === item.id
                          ? 'bg-green-500 text-white'
                          : 'text-gray-400 hover:text-green-600'
                      }`}
                      title="设为右栏"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{item.department}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {!leftItem || !rightItem ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <FileCode className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg">请选择要比对的两个事项</p>
              <p className="text-sm mt-2">从左侧列表点击箭头按钮设置左右栏</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex border-b border-gray-200 bg-gray-50">
                <div className="flex-1 p-3 border-r border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="font-medium text-gray-800">{leftItem.itemName}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {leftItem.department} · {leftItem.itemCode}
                  </div>
                </div>
                <div className="w-10 flex items-center justify-center">
                  <ArrowRightLeft className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1 p-3 border-l border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="font-medium text-gray-800">{rightItem.itemName}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {rightItem.department} · {rightItem.itemCode}
                  </div>
                </div>
              </div>

              {comparisonResult && comparisonResult.length > 0 && (
                <div className="bg-amber-50 border-b border-amber-200 p-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm text-amber-700">
                    发现 {comparisonResult.length} 处字段差异
                  </span>
                </div>
              )}

              <div className="flex-1 overflow-auto p-4">
                <div className="space-y-4">
                  {selectedFields.map(field => {
                    const diff = comparisonResult?.find(d => d.field === field)
                    const leftValue = getFieldValue(leftItem, field)
                    const rightValue = getFieldValue(rightItem, field)
                    const hasDiff = !!diff

                    return (
                      <div
                        key={field}
                        className={`border rounded-lg overflow-hidden ${
                          hasDiff ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200'
                        }`}
                      >
                        <div className={`px-3 py-2 border-b flex items-center justify-between ${
                          hasDiff ? 'bg-amber-100 border-amber-200' : 'bg-gray-100 border-gray-200'
                        }`}>
                          <span className="text-sm font-medium text-gray-700">
                            {FIELD_LABELS[field]}
                          </span>
                          {hasDiff ? (
                            <span className="text-xs text-amber-700 font-medium">存在差异</span>
                          ) : (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              内容一致
                            </span>
                          )}
                        </div>
                        <div className="flex">
                          <div className="flex-1 p-3 border-r border-gray-200 min-h-[60px]">
                            {diff ? (
                              <DiffHighlight
                                segments={diff.diffSegments}
                                className="text-sm text-gray-800"
                              />
                            ) : (
                              <span className="text-sm text-gray-600">
                                {leftValue || <span className="text-gray-400 italic">无内容</span>}
                              </span>
                            )}
                          </div>
                          <div className="w-10 flex items-center justify-center bg-gray-50">
                            {hasDiff && (
                              <X className="w-4 h-4 text-red-400" />
                            )}
                            {!hasDiff && leftValue && (
                              <Check className="w-4 h-4 text-green-400" />
                            )}
                          </div>
                          <div className="flex-1 p-3 border-l border-gray-200 min-h-[60px]">
                            {diff ? (
                              <DiffHighlight
                                segments={diff.diffSegments.map(s => ({
                                  ...s,
                                  type: s.type === 'added' ? 'added' : s.type === 'removed' ? 'removed' : s.type
                                }))}
                                className="text-sm text-gray-800"
                              />
                            ) : (
                              <span className="text-sm text-gray-600">
                                {rightValue || <span className="text-gray-400 italic">无内容</span>}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
