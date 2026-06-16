import { v4 as uuidv4 } from 'uuid'
import type { ItemRecord, ImportSource } from '@/types'

export function generateDemoData(): { source: ImportSource; items: ItemRecord[] } {
  const sourceId = uuidv4()
  const now = Date.now()
  
  const items: ItemRecord[] = [
    {
      id: uuidv4(),
      sourceId,
      itemName: '个体工商户设立登记',
      itemCode: '000131001000',
      department: '市场监督管理局',
      acceptConditions: [
        { id: uuidv4(), content: '具有完全民事行为能力', type: 'positive' },
        { id: uuidv4(), content: '无民事行为能力或者限制民事行为能力', type: 'negative' },
        { id: uuidv4(), content: '有固定的经营场所', type: 'positive' },
        { id: uuidv4(), content: '材料齐全符合条件', type: 'positive' }
      ],
      materials: [
        { id: uuidv4(), name: '身份证', required: true },
        { id: uuidv4(), name: '工商营业执照申请书', required: true },
        { id: uuidv4(), name: '经营场所证明', required: true },
        { id: uuidv4(), name: '户口簿原件', required: false },
        { id: uuidv4(), name: '相关材料', required: true }
      ],
      processSteps: [
        { id: uuidv4(), stepNumber: 1, stepName: '申请', description: '当事人提交申请材料', duration: '1个工作日', handler: '综窗受理人员' },
        { id: uuidv4(), stepNumber: 2, stepName: '受理', description: '窗口工作人员审核材料，对材料齐全的出具受理通知书', duration: '2工作日', handler: '受理人员' },
        { id: uuidv4(), stepNumber: 3, stepName: '审核', description: '审核人员对申请材料进行实质审查', duration: '3个工作日', handler: '审核人员' },
        { id: uuidv4(), stepNumber: 4, stepName: '受理', description: '对符合条件的申请进行再次确认', duration: '1个工作日', handler: '复核人员' },
        { id: uuidv4(), stepNumber: 5, stepName: '发证', description: '打印营业执照并送达申请人', duration: '即办', handler: '发证窗口' }
      ],
      specialProcedures: [],
      timeLimit: '8工作日',
      feeStandard: '不收费',
      handlingLocation: '市政务服务中心二楼A区201窗口',
      onlineUrl: 'zwfw.example.gov.cn',
      consultPhone: '12315',
      importTime: now
    },
    {
      id: uuidv4(),
      sourceId,
      itemName: '出版物经营许可证核发',
      itemCode: '000132001000',
      department: '新闻出版局',
      acceptConditions: [
        { id: uuidv4(), content: '年满18周岁', type: 'positive' },
        { id: uuidv4(), content: '未满18周岁', type: 'negative' },
        { id: uuidv4(), content: '有确定的名称和经营范围', type: 'positive' },
        { id: uuidv4(), content: '有相应的资金和设备', type: 'positive' },
        { id: uuidv4(), content: '经营场所面积原则上不低于50平方米', type: 'positive' }
      ],
      materials: [
        { id: uuidv4(), name: '申请书', required: true },
        { id: uuidv4(), name: '居民身份证', required: true },
        { id: uuidv4(), name: '学历证书', required: false },
        { id: uuidv4(), name: '经营场所产权证明', required: true },
        { id: uuidv4(), name: '有关材料', required: false }
      ],
      processSteps: [
        { id: uuidv4(), stepNumber: 1, stepName: '受理', description: '接收申办人提交的申请材料等等', duration: '1工作日', handler: '窗口工作人员' },
        { id: uuidv4(), stepNumber: 3, stepName: '审核', description: '对申请材料进行审核，视情况组织现场核查', duration: '5工作日', handler: '业务科室' },
        { id: uuidv4(), stepNumber: 4, stepName: '决定', description: '作出准予或不予行政许可的决定', duration: '2个工作日', handler: '审批领导' }
      ],
      specialProcedures: [],
      timeLimit: '10天',
      feeStandard: '不收费',
      handlingLocation: '市政务服务中心三楼B区305窗口',
      onlineUrl: 'http://zwfw.example.gov.cn/xwcbj',
      consultPhone: '010 12345',
      importTime: now
    },
    {
      id: uuidv4(),
      sourceId,
      itemName: '医师执业注册',
      itemCode: '000123001000',
      department: '卫生健康委员会',
      acceptConditions: [
        { id: uuidv4(), content: '身体健康', type: 'positive' },
        { id: uuidv4(), content: '患有特定疾病', type: 'negative' },
        { id: uuidv4(), content: '具有医师资格证书', type: 'positive' },
        { id: uuidv4(), content: '在医疗、预防、保健机构中执业', type: 'positive' }
      ],
      materials: [
        { id: uuidv4(), name: '医师执业注册申请表', required: true },
        { id: uuidv4(), name: '医师资格证书', required: true },
        { id: uuidv4(), name: '身份证', required: true },
        { id: uuidv4(), name: '一寸免冠照片', required: true },
        { id: uuidv4(), name: '单位证明', required: true }
      ],
      processSteps: [
        { id: uuidv4(), stepNumber: 1, stepName: '申请', description: '申请人提交注册申请材料', duration: '1个工作日', handler: '政务服务窗口' },
        { id: uuidv4(), stepNumber: 2, stepName: '受理', description: '对申请材料进行初审，符合条件的予以受理', duration: '2个工作日', handler: '受理人员' },
        { id: uuidv4(), stepNumber: 3, stepName: '审核', description: '对申请材料进行审核，必要时进行现场核查等等', duration: '3个工作日', handler: '医政科' },
        { id: uuidv4(), stepNumber: 4, stepName: '审批', description: '符合条件的准予注册，不符合的说明理由', duration: '2个工作日', handler: '分管领导' }
      ],
      specialProcedures: [],
      timeLimit: '10个工作日',
      feeStandard: '不收费',
      handlingLocation: '市政务服务中心四楼C区402窗口',
      onlineUrl: 'https://zwfw.example.gov.cn/wsjkw',
      consultPhone: '010-12320',
      importTime: now
    },
    {
      id: uuidv4(),
      sourceId,
      itemName: '建设项目环境影响评价审批',
      itemCode: '000116001000',
      department: '生态环境局',
      acceptConditions: [
        { id: uuidv4(), content: '符合环境保护相关法律法规', type: 'positive' },
        { id: uuidv4(), content: '符合城市总体规划和环境功能区划', type: 'positive' },
        { id: uuidv4(), content: '污染物排放符合国家和地方排放标准', type: 'positive' },
        { id: uuidv4(), content: '涉及公共利益重大项目', type: 'positive' }
      ],
      materials: [
        { id: uuidv4(), name: '建设项目环境影响评价文件审批申请书', required: true },
        { id: uuidv4(), name: '环境影响报告书（表）', required: true },
        { id: uuidv4(), name: '工商营业执照', required: true },
        { id: uuidv4(), name: '委托书', required: false },
        { id: uuidv4(), name: '相应证明材料', required: true }
      ],
      processSteps: [
        { id: uuidv4(), stepNumber: 1, stepName: '受理', description: '接收申请人提交的申请材料', duration: '1个工作日', handler: '政务服务窗口' },
        { id: uuidv4(), stepNumber: 2, stepName: '技术审查', description: '组织专家对环境影响评价文件进行技术评审', duration: '10个工作日', handler: '评估中心' },
        { id: uuidv4(), stepNumber: 3, stepName: '审核', description: '根据技术审查意见进行审核', duration: '5个工作日', handler: '环评科' },
        { id: uuidv4(), stepNumber: 4, stepName: '审批', description: '作出审批决定', duration: '5个工作日', handler: '分管领导' }
      ],
      specialProcedures: [],
      timeLimit: '30个工作日',
      feeStandard: '不收费',
      handlingLocation: '市政务服务中心五楼D区501窗口',
      onlineUrl: 'https://zwfw.example.gov.cn/sthj',
      consultPhone: '12369',
      importTime: now
    },
    {
      id: uuidv4(),
      sourceId,
      itemName: '个体工商户设立登记',
      itemCode: '000131001000',
      department: '行政审批服务局',
      acceptConditions: [
        { id: uuidv4(), content: '具有完全民事行为能力', type: 'positive' },
        { id: uuidv4(), content: '有固定的经营场所', type: 'positive' },
        { id: uuidv4(), content: '申请材料齐全、符合法定形式', type: 'positive' }
      ],
      materials: [
        { id: uuidv4(), name: '身份证明', required: true },
        { id: uuidv4(), name: '个体工商户登记申请表', required: true },
        { id: uuidv4(), name: '经营场所使用证明', required: true }
      ],
      processSteps: [
        { id: uuidv4(), stepNumber: 1, stepName: '申请', description: '申请人提交申请材料', duration: '即办', handler: '综窗受理人员' },
        { id: uuidv4(), stepNumber: 2, stepName: '审核', description: '审核申请材料是否齐全、符合法定形式', duration: '1个工作日', handler: '审核人员' },
        { id: uuidv4(), stepNumber: 3, stepName: '决定', description: '作出准予登记决定', duration: '1个工作日', handler: '审批人员' },
        { id: uuidv4(), stepNumber: 4, stepName: '发证', description: '打印并送达营业执照', duration: '即办', handler: '发证窗口' }
      ],
      specialProcedures: [],
      timeLimit: '2个工作日',
      feeStandard: '不收费',
      handlingLocation: '市政务服务中心二楼A区205窗口',
      onlineUrl: 'https://zwfw.example.gov.cn/scjgj',
      consultPhone: '010-12315',
      importTime: now
    },
    {
      id: uuidv4(),
      sourceId,
      itemName: '食品经营许可证核发',
      itemCode: '000131003000',
      department: '市场监督管理局',
      acceptConditions: [
        { id: uuidv4(), content: '具有与经营的食品品种、数量相适应的食品原料处理和食品加工、销售、贮存等场所', type: 'positive' },
        { id: uuidv4(), content: '具有与经营的食品品种、数量相适应的经营设备或者设施', type: 'positive' },
        { id: uuidv4(), content: '有专职或者兼职的食品安全专业技术人员、食品安全管理人员和保证食品安全的规章制度', type: 'positive' },
        { id: uuidv4(), content: '具有合理的设备布局和工艺流程，防止待加工食品与直接入口食品、原料与成品交叉污染', type: 'positive' }
      ],
      materials: [
        { id: uuidv4(), name: '食品经营许可申请书', required: true },
        { id: uuidv4(), name: '营业执照副本', required: true },
        { id: uuidv4(), name: '身份证', required: true },
        { id: uuidv4(), name: '食品安全管理制度文本', required: true },
        { id: uuidv4(), name: '经营场所布局图', required: true }
      ],
      processSteps: [
        { id: uuidv4(), stepNumber: 1, stepName: '受理', description: '接收申请材料，材料齐全的出具受理通知书', duration: '1个工作日', handler: '窗口工作人员' },
        { id: uuidv4(), stepNumber: 2, stepName: '现场核查', description: '组织执法人员进行现场核查，核查经营场所是否符合要求', duration: '5个工作日', handler: '执法大队' },
        { id: uuidv4(), stepNumber: 3, stepName: '审核', description: '根据申请材料和现场核查意见进行审核', duration: '3个工作日', handler: '食品科' },
        { id: uuidv4(), stepNumber: 4, stepName: '决定', description: '作出是否准予许可的决定', duration: '2个工作日', handler: '分管领导' }
      ],
      specialProcedures: [
        { id: uuidv4(), type: '现场核查', condition: '所有食品经营许可申请', description: '需要对经营场所进行现场核查，所需时间不计算在承诺期限内' }
      ],
      timeLimit: '15个工作日',
      feeStandard: '不收费',
      handlingLocation: '市政务服务中心二楼A区208窗口',
      onlineUrl: 'https://zwfw.example.gov.cn/spjy',
      consultPhone: '12331',
      importTime: now
    }
  ]
  
  const source: ImportSource = {
    id: sourceId,
    name: '示例数据（演示用）',
    type: 'demo',
    importTime: now,
    itemCount: items.length
  }
  
  return { source, items }
}

export function generateDemoVersion2(): { source: ImportSource; items: ItemRecord[] } {
  const sourceId = uuidv4()
  const now = Date.now()
  
  const items: ItemRecord[] = [
    {
      id: uuidv4(),
      sourceId,
      itemName: '个体工商户设立登记',
      itemCode: '000131001000',
      department: '市场监督管理局',
      acceptConditions: [
        { id: uuidv4(), content: '具有完全民事行为能力', type: 'positive' },
        { id: uuidv4(), content: '有固定的经营场所', type: 'positive' },
        { id: uuidv4(), content: '申请材料齐全、符合法定形式', type: 'positive' }
      ],
      materials: [
        { id: uuidv4(), name: '身份证明', required: true },
        { id: uuidv4(), name: '个体工商户登记申请表', required: true },
        { id: uuidv4(), name: '经营场所使用证明', required: true },
        { id: uuidv4(), name: '委托代理人证明', required: false }
      ],
      processSteps: [
        { id: uuidv4(), stepNumber: 1, stepName: '申请', description: '申请人提交申请材料', duration: '即办', handler: '综窗受理人员' },
        { id: uuidv4(), stepNumber: 2, stepName: '审核', description: '审核申请材料是否齐全、符合法定形式', duration: '1个工作日', handler: '审核人员' },
        { id: uuidv4(), stepNumber: 3, stepName: '决定', description: '作出准予登记决定', duration: '1个工作日', handler: '审批人员' },
        { id: uuidv4(), stepNumber: 4, stepName: '发证', description: '打印并送达营业执照', duration: '即办', handler: '发证窗口' }
      ],
      specialProcedures: [],
      timeLimit: '2个工作日',
      feeStandard: '不收费',
      handlingLocation: '市政务服务中心二楼A区201窗口',
      onlineUrl: 'https://zwfw.example.gov.cn/scjgj',
      consultPhone: '010-12315',
      version: 'v2.0',
      importTime: now
    }
  ]
  
  const source: ImportSource = {
    id: sourceId,
    name: '示例数据V2（比对演示用）',
    type: 'demo',
    importTime: now,
    itemCount: items.length
  }
  
  return { source, items }
}
