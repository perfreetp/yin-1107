import { useState, useEffect } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { ImportWorkspace } from '@/components/workspaces/ImportWorkspace';
import { CompareWorkspace } from '@/components/workspaces/CompareWorkspace';
import { BatchWorkspace } from '@/components/workspaces/BatchWorkspace';
import { IssuesWorkspace } from '@/components/workspaces/IssuesWorkspace';
import { ExportWorkspace } from '@/components/workspaces/ExportWorkspace';
import { WorkspaceType } from '@/types';
import { Upload, GitCompare, Wand2, AlertTriangle, Download, Settings, HelpCircle, Zap, FileCheck } from 'lucide-react';
const workspaceConfig: {
 id: WorkspaceType;
 label: string;
 icon: any;
 description: string;
}[] = [
 { id: 'import', label: '导入区', icon: Upload, description: '从Excel、JSON、文本或剪贴板导入事项数据' },
 { id: 'compare', label: '双栏比对', icon: GitCompare, description: '智能匹配相同事项，逐字段差异高亮显示' },
 { id: 'batch', label: '批量处理', icon: Wand2, description: '批量替换常见表述，材料名称规范化' },
 { id: 'issues', label: '问题清单', icon: AlertTriangle, description: '自动检测问题，按类型/部门筛选复核' },
 { id: 'export', label: '导出区', icon: Download, description: '生成审校报告，导出Excel/JSON/HTML' },
];
function AppContent() {
 const { state, setCurrentWorkspace, runDetection, clearAll, loadDemoData } = useApp();
 const [showWelcome, setShowWelcome] = useState(state.items.length === 0);
 useEffect(() => {
 setShowWelcome(state.items.length === 0);
 }, [state.items.length]);
 const handleLoadDemo = () => {
 loadDemoData();
 setTimeout(() => runDetection(), 100);
 };
 return (<div className="h-screen flex flex-col bg-slate-50">
 <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg">
 <div className="px-6 py-3 flex items-center justify-between border-b border-slate-700">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
 <FileCheck className="w-6 h-6 text-white"/>
 </div>
 <div>
 <h1 className="text-xl font-bold tracking-tight">实施清单智能审校工具</h1>
 <p className="text-xs text-slate-400">v1.0.0 · 专业版</p>
 </div>
 </div>

 <div className="flex items-center gap-4">
 {state.items.length > 0 && (<div className="flex items-center gap-6 text-sm">
 <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
 <Zap className="w-4 h-4 text-amber-400"/>
 <span className="text-slate-300">事项 <span className="font-semibold text-white">{state.items.length}</span></span>
 </div>
 <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
 <AlertTriangle className="w-4 h-4 text-red-400"/>
 <span className="text-slate-300">问题 <span className="font-semibold text-white">{state.issues.length}</span></span>
 </div>
 <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
 <FileCheck className="w-4 h-4 text-green-400"/>
 <span className="text-slate-300">已解决 <span className="font-semibold text-white">{state.issues.filter(i => i.status === 'resolved').length}</span></span>
 </div>
 </div>)}

 <div className="flex items-center gap-2">
 <button onClick={handleLoadDemo} className="px-3 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2">
 <Zap className="w-4 h-4"/>
 加载演示数据
 </button>
 {state.items.length > 0 && (<button onClick={clearAll} className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors">
 清空数据
 </button>)}
 <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors" title="设置">
 <Settings className="w-5 h-5"/>
 </button>
 <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors" title="帮助">
 <HelpCircle className="w-5 h-5"/>
 </button>
 </div>
 </div>
 </div>

 <nav className="px-6 py-2 flex items-center gap-1 bg-slate-800/50">
 {workspaceConfig.map((ws) => {
 const Icon = ws.icon;
 const isActive = state.currentWorkspace === ws.id;
 const hasIssues = ws.id === 'issues' && state.issues.filter(i => i.status === 'pending').length > 0;
 const pendingCount = state.issues.filter(i => i.status === 'pending').length;
 return (<button key={ws.id} onClick={() => setCurrentWorkspace(ws.id)} className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${isActive
 ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
 : 'text-slate-300 hover:text-white hover:bg-slate-700/50'}`} title={ws.description}>
 <Icon className="w-4 h-4"/>
 <span>{ws.label}</span>
 {hasIssues && (<span className="absolute -top-1 -right-1 min-w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5">
 {pendingCount}
 </span>)}
 </button>);
 })}
 </nav>
 </header>

 <main className="flex-1 overflow-hidden">
 {showWelcome ? (<WelcomeScreen onLoadDemo={handleLoadDemo}/>) : (<>
 {state.currentWorkspace === 'import' && <ImportWorkspace />}
 {state.currentWorkspace === 'compare' && <CompareWorkspace />}
 {state.currentWorkspace === 'batch' && <BatchWorkspace />}
 {state.currentWorkspace === 'issues' && <IssuesWorkspace />}
 {state.currentWorkspace === 'export' && <ExportWorkspace />}
 </>)}
 </main>

 <footer className="bg-white border-t border-slate-200 px-6 py-2 flex items-center justify-between text-xs text-slate-500">
 <div className="flex items-center gap-4">
 <span>数据来源: {state.sources.length} 个文件</span>
 <span>|</span>
 <span>最后检测: {state.issues.length > 0 ? new Date().toLocaleTimeString() : '未检测'}</span>
 </div>
 <div className="flex items-center gap-4">
 <span className="text-green-600 font-medium">✓ 专业审校模式</span>
 <span>|</span>
 <span>© 2024 政务服务标准化工具</span>
 </div>
 </footer>
 </div>);
}
function WelcomeScreen({ onLoadDemo }: {
 onLoadDemo: () => void;
}) {
 const features = [
 { icon: Upload, title: '多源数据导入', desc: '支持Excel、JSON、文本、剪贴板多种格式一键导入' },
 { icon: GitCompare, title: '智能双栏比对', desc: '自动识别相同事项版本，逐字段差异高亮显示' },
 { icon: AlertTriangle, title: '问题自动检测', desc: '受理条件冲突、材料不规范、环节重复6类问题检测' },
 { icon: Wand2, title: '批量智能修订', desc: '常见表述批量替换，材料名称规范化推荐' },
 { icon: FileCheck, title: '整改意见生成', desc: '一键生成标准化整改意见，支持按部门汇总' },
 { icon: Download, title: '多格式报告导出', desc: '生成Excel、JSON、HTML三种格式审校报告' },
 ];
 return (<div className="h-full overflow-auto bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
 <div className="max-w-6xl mx-auto px-8 py-12">
 <div className="text-center mb-12">
 <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-2xl shadow-blue-500/30 mb-6">
 <FileCheck className="w-10 h-10 text-white"/>
 </div>
 <h2 className="text-4xl font-bold text-slate-800 mb-4">
 实施清单智能审校工具
 </h2>
 <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
 专为审批处室骨干、标准化专员和综窗管理负责人设计，<br />
 高效处理"逐项比对"和"批量修订"，让清单审校事半功倍
 </p>

 <div className="flex items-center justify-center gap-4 mb-12">
 <button onClick={onLoadDemo} className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all transform hover:-translate-y-0.5 flex items-center gap-3">
 <Zap className="w-5 h-5"/>
 快速体验 - 加载演示数据
 </button>
 <div className="text-left pl-6 border-l border-slate-300">
 <p className="text-sm text-slate-500 mb-1">或从顶部导航选择</p>
 <p className="text-sm font-medium text-slate-700">「导入区」开始导入您的数据</p>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-3 gap-6 mb-12">
 {features.map((feature, index) => {
 const Icon = feature.icon;
 return (<div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-slate-100 hover:border-blue-200 group">
 <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mb-4 group-hover:from-blue-500 group-hover:to-indigo-600 transition-all">
 <Icon className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors"/>
 </div>
 <h3 className="text-lg font-semibold text-slate-800 mb-2">{feature.title}</h3>
 <p className="text-slate-600 text-sm leading-relaxed">{feature.desc}</p>
 </div>);
 })}
 </div>

 <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 text-white shadow-2xl">
 <div className="flex items-start gap-8">
 <div className="flex-1">
 <h3 className="text-xl font-bold mb-3">适用场景</h3>
 <div className="grid grid-cols-3 gap-4">
 <div className="bg-white/10 backdrop-blur rounded-xl p-4">
 <div className="text-2xl font-bold text-blue-400 mb-1">集中攻坚期</div>
 <p className="text-sm text-slate-300">事项清单编制攻坚阶段，高效完成成批校改</p>
 </div>
 <div className="bg-white/10 backdrop-blur rounded-xl p-4">
 <div className="text-2xl font-bold text-amber-400 mb-1">迎评前复核</div>
 <p className="text-sm text-slate-300">考核评估前快速排查问题，确保零差错</p>
 </div>
 <div className="bg-white/10 backdrop-blur rounded-xl p-4">
 <div className="text-2xl font-bold text-green-400 mb-1">清单整治</div>
 <p className="text-sm text-slate-300">专项整治行动，批量规范事项要素</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>);
}
export default function App() {
 return (<AppProvider>
 <AppContent />
 </AppProvider>);
}

