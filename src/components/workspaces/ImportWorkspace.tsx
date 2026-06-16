import { useRef, useState } from 'react'
import { Upload, FileSpreadsheet, FileJson, FileText, Clipboard, Database, Trash2, FileX, PlayCircle } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { importFromExcel, importFromJson, importFromText } from '@/core/importExportEngine'
import type { ItemRecord, ImportSource } from '@/types'

export function ImportWorkspace() {
  const { state, addSource, removeSource, loadDemoData, setCurrentWorkspace, runDetection } = useApp()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [showPasteModal, setShowPasteModal] = useState(false)
  const [pasteSourceName, setPasteSourceName] = useState('')

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsLoading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const arrayBuffer = await file.arrayBuffer()
        
        let result: { source: ImportSource; items: ItemRecord[] } | null = null
        
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          result = importFromExcel(arrayBuffer, file.name)
        } else if (file.name.endsWith('.json')) {
          const text = new TextDecoder().decode(arrayBuffer)
          result = importFromJson(text, file.name)
        } else if (file.name.endsWith('.txt')) {
          const text = new TextDecoder().decode(arrayBuffer)
          result = importFromText(text, file.name)
        }
        
        if (result) {
          addSource(result.source, result.items)
        }
      }
    } catch (error) {
      console.error('导入文件失败:', error)
      alert('文件导入失败，请检查文件格式')
    } finally {
      setIsLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handlePasteImport = () => {
    if (!pasteText.trim()) {
      alert('请粘贴要导入的文本内容')
      return
    }
    if (!pasteSourceName.trim()) {
      alert('请输入数据源名称')
      return
    }
    
    try {
      const result = importFromText(pasteText, pasteSourceName)
      addSource(result.source, result.items)
      setShowPasteModal(false)
      setPasteText('')
      setPasteSourceName('')
    } catch (error) {
      console.error('粘贴导入失败:', error)
      alert('文本解析失败，请检查格式')
    }
  }

  const handleLoadDemo = () => {
    loadDemoData()
  }

  const handleStartReview = () => {
    if (state.items.length === 0) {
      alert('请先导入数据')
      return
    }
    runDetection()
    setCurrentWorkspace('issues')
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN')
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">数据导入</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border-2 border-dashed border-blue-300 transition-colors"
          >
            <FileSpreadsheet className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-blue-700">Excel 文件</span>
            <span className="text-xs text-blue-500 mt-1">.xlsx / .xls</span>
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex flex-col items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg border-2 border-dashed border-green-300 transition-colors"
          >
            <FileJson className="w-8 h-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-green-700">JSON 文件</span>
            <span className="text-xs text-green-500 mt-1">.json</span>
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex flex-col items-center justify-center p-4 bg-amber-50 hover:bg-amber-100 rounded-lg border-2 border-dashed border-amber-300 transition-colors"
          >
            <FileText className="w-8 h-8 text-amber-600 mb-2" />
            <span className="text-sm font-medium text-amber-700">文本文件</span>
            <span className="text-xs text-amber-500 mt-1">.txt</span>
          </button>
          
          <button
            onClick={() => setShowPasteModal(true)}
            className="flex flex-col items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border-2 border-dashed border-purple-300 transition-colors"
          >
            <Clipboard className="w-8 h-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-purple-700">粘贴导入</span>
            <span className="text-xs text-purple-500 mt-1">从剪贴板</span>
          </button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".xlsx,.xls,.json,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={handleLoadDemo}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
          >
            <Database className="w-4 h-4" />
            加载示例数据
          </button>
          
          <button
            onClick={handleStartReview}
            disabled={state.items.length === 0}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              state.items.length > 0
                ? 'bg-primary-600 hover:bg-primary-700 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <PlayCircle className="w-4 h-4" />
            开始审校 ({state.items.length} 个事项)
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4 bg-gray-50">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-600">已导入的数据源</h3>
          <span className="text-xs text-gray-500">
            共 {state.sources.length} 个数据源，{state.items.length} 个事项
          </span>
        </div>
        
        {state.sources.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-gray-400">
            <Upload className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg">暂无导入数据</p>
            <p className="text-sm mt-2">请从上方选择导入方式，或加载示例数据体验功能</p>
          </div>
        ) : (
          <div className="space-y-3">
            {state.sources.map(source => {
              const sourceItems = state.items.filter(i => i.sourceId === source.id)
              const typeIcons = {
                excel: FileSpreadsheet,
                json: FileJson,
                text: FileText,
                clipboard: Clipboard,
                demo: Database
              }
              const TypeIcon = typeIcons[source.type]
              
              return (
                <div
                  key={source.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        source.type === 'excel' ? 'bg-blue-100' :
                        source.type === 'json' ? 'bg-green-100' :
                        source.type === 'text' ? 'bg-amber-100' :
                        source.type === 'clipboard' ? 'bg-purple-100' :
                        'bg-gray-100'
                      }`}>
                        <TypeIcon className={`w-5 h-5 ${
                          source.type === 'excel' ? 'text-blue-600' :
                          source.type === 'json' ? 'text-green-600' :
                          source.type === 'text' ? 'text-amber-600' :
                          source.type === 'clipboard' ? 'text-purple-600' :
                          'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">{source.name}</h4>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <span>{sourceItems.length} 个事项</span>
                          <span>{formatTime(source.importTime)}</span>
                          {source.filePath && (
                            <span className="truncate max-w-xs">{source.filePath}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeSource(source.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="删除此数据源"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {sourceItems.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="text-xs text-gray-500 mb-2">包含事项：</div>
                      <div className="flex flex-wrap gap-2">
                        {sourceItems.slice(0, 5).map(item => (
                          <span
                            key={item.id}
                            className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-xs text-gray-700"
                          >
                            {item.itemName}
                          </span>
                        ))}
                        {sourceItems.length > 5 && (
                          <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-xs text-gray-500">
                            +{sourceItems.length - 5} 更多
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      
      {showPasteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">粘贴导入</h3>
              <button
                onClick={() => setShowPasteModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <FileX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  数据源名称
                </label>
                <input
                  type="text"
                  value={pasteSourceName}
                  onChange={e => setPasteSourceName(e.target.value)}
                  placeholder="例如：2024版事项清单"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  粘贴内容
                </label>
                <textarea
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                  placeholder={`事项名称：个体工商户设立登记
事项编码：000131001000
实施部门：市场监督管理局
受理条件：具有完全民事行为能力；有固定的经营场所
申请材料：身份证明(必填)；申请表(必填)
办理环节：1. 申请：提交材料(1工作日，窗口) → 2. 审核：审查材料(2工作日，审核科)
承诺时限：3个工作日
办理地点：政务服务中心

事项名称：出版物经营许可证核发
...`}
                  className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none font-mono text-sm"
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handlePasteImport}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm transition-colors"
              >
                导入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
