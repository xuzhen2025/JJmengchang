# 梦畅 AIGC 一期原型功能闭环审查清单

审查日期：2026-09-28  
审查对象：`mengchang3-phase1-main`  
当前阶段：只汇总问题，不修改原型功能；所有问题初始状态均为「待处理」。  
统计口径：按可独立验收的问题归并，同一原因涉及多个页面只记一次；配置矩阵和权限附表不重复计数。

## 一、结论与范围

当前不能认定「一期原型已全面闭环」。本轮确认 **62 项问题：P1 20 项，P2 42 项**；另列 **9 类待决策边界**、非活动代码清理和真实集成验证事项。

最需要优先处理的不是新增页面，而是把已有入口、配置和数据连起来：

1. 权限矩阵、登录身份和组织成员并未形成统一约束，普通管理员还被当作超级管理员计算部分权限。
2. 用户端与管理端的多数资源记录不统一，上传可见范围、关联内容、部分编辑和删除不能跨页面保持一致。
3. 企业积分、个人消费和当前登录人存在断联；刷新、切换账号及跨日会产生错误结果。
4. 复刻完成后的下载和入库没有连接有效视频文件。
5. 广告账户可见范围未覆盖报表及导出，账户绑定、建计划和统计结果未使用一致的数据来源。
6. 多项管理配置及操作按钮只显示成功提示，实际没有保存或影响业务。

| 模块 | 编号 | P1 | P2 | 合计 |
| --- | --- | ---: | ---: | ---: |
| 身份、权限、组织与成员 | AUTH-01 至 AUTH-13 | 6 | 7 | 13 |
| 资源库与内容配置 | RES-01 至 RES-16 | 6 | 10 | 16 |
| 爆款复刻、任务与积分 | CRT-01 至 CRT-12 | 6 | 6 | 12 |
| 广告账户、投放与分析 | ADS-01 至 ADS-09 | 2 | 7 | 9 |
| 全局系统配置 | SYS-01 至 SYS-07 | 0 | 7 | 7 |
| 管理端审计与登录记录 | AUD-01 至 AUD-04 | 0 | 4 | 4 |
| 已删除业务的可见残留 | SCOPE-01 | 0 | 1 | 1 |
| **合计** | **62 项** | **20** | **42** | **62** |

### 判定标准

- **P1**：核心演示流程受阻、数据归属错误、已有权限/额度约束可被绕过，或用户填写的重要数据被丢失。
- **P2**：现有配置、按钮、筛选、反馈或跨页面状态明确不一致。
- **待决策**：事实已经查明，但一期是否需要、采用何种业务规则尚未确认。暂不计入62项。
- **模拟不是缺陷**：可以使用模拟账号、模拟 AI 结果和模拟千川回执；但同一记录应在不同页面一致，按钮必须完成它声称的动作。
- **范围限制**：只审查一期；不修改原版、上传副本或参考手册。不扩建巨量广告业务，保留页面中的共用问题仍记录。
- **参考优先级**：用户已确认的一期规则及当前功能目标优先。云视频管家手册是参考平台资料，不能直接认定为本平台已实现能力。

### 证据与验证边界

- 主体证据为源码调用链：配置写入、状态存储、业务读取、页面结果是否相连；条目均附具体位置。
- 浏览器只读抽查了可达页面与系统设置。确认六个可见区块：广告账户可见性、功能开关、延迟开放查看、外网权限、发布可见性、自动修改状态。没有在用户当前数据上保存配置、删除资源、修改密码或清空存储。
- 使用隔离的进程内存做过普通管理员权限探针，未读写浏览器存储。
- 已运行现有自动化测试，**309 项通过**；`npm.cmd run lint`（TypeScript检查）通过。测试通过不等于业务闭环通过。
- 尚未逐项完成62项的浏览器复现；布局边缘、多窗口并发、所有媒体实际可访问性和所有下载文件内容未全量验证。文中的“触发”是依据源码可执行的复现步骤，不代表已在用户当前数据中实际执行。
- 本轮没有重新逐页核对千川在线接口文档，也没有真实授权或投放。因此不能据此宣称与千川生产接口100%一致。
- 以下源码行号以本次审查快照为准，后续修复后可能变化。

## 二、身份、权限、组织与成员

### AUTH-01 [P1] 用户端权限矩阵未覆盖大多数入口和操作
- **触发及问题**：给普通用户取消资源查看、上传、编辑、下载、删除或爆款复刻权限后，导航与相应操作没有统一读取这些权限。配置保存并不等于操作受到限制。
- **证据**：[用户端权限树](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:105)；[未过滤的菜单](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/Sidebar.tsx:61)；[资源路由](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/App.tsx:1557)；[复刻路由](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/App.tsx:1613)。多数叶子权限没有业务消费端，完整清单见附表。
- **影响边界**：推送、计划管理及衍生已有局部权限校验，不能说所有权限均无效。
- **验收**：沿用现有权限项，取消权限后入口与提交动作均拒绝；恢复后生效，详情和间接入口不能绕过。

### AUTH-02 [P1] 管理端菜单与多数管理操作不受角色统一限制
- **触发及问题**：管理员角色没有内容管理、积分管理或组织管理权限，管理端依然直接渲染对应页面；进入页面后的多数操作也没有同一套权限检查。
- **证据**：[管理端权限树](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:208)；[管理端菜单](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/Sidebar.tsx:70)；[管理端页面渲染](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/App.tsx:1508)；[内容管理页签](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminView.tsx:61)。
- **验收**：按当前登录成员的有效角色过滤菜单，并在修改动作处再校验；只读角色不能保存或删除。复用已有广告管理的拒绝机制，不新增一套权限体系。

### AUTH-03 [P1] 角色和成员的数据范围没有约束资源和业务列表
- **触发及问题**：设置“本人／部门及下级／全部”后，仍读取原有全量集合，成员与角色同时配置时的合并规则也没有统一业务实现。
- **证据**：[角色数据范围](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:98)；[成员范围保存](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:918)；[角色范围修改](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:1282)；[资源读取入口](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/App.tsx:1557)。范围字段主要停留在配置、回显和导出中。
- **验收**：用本人、同组、同部门、其他部门样例逐一核对列表、详情、选择器、统计和导出；多角色合并规则先明确，再统一使用。

### AUTH-04 [P1] 人员新增、禁用和删除没有接入登录生命周期
- **触发及问题**：管理端新增或导入成员不能成为可登录账号；禁用或删除普通演示成员后，登录仍只校验固定账号表，已有会话也未统一失效。
- **证据**：[固定三账号](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/App.tsx:68)；[会话恢复](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/App.tsx:100)；[登录处理](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/App.tsx:226)；[成员保存](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:895)；[禁用与删除](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:970)。
- **例外**：普通用户的广告操作会重新检查成员状态并拒绝，不代表其他功能也已封禁。
- **验收**：复用同一成员身份完成新增、登录、禁用、拒绝访问、恢复和注销；原型不要求接真实短信或身份服务。

### AUTH-05 [P1] 普通管理员被按超级管理员计算关键权限
- **触发及问题**：`guanliyuan` 与 `chaojiguanliyuan` 走相同分支，读取超级管理员角色，并固定追加推送、计划管理、衍生、广告主管理和系统配置权限。普通管理员自己的角色与启停状态不参与这一分支。
- **证据**：[getAdActor](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/lib/adPush.ts:110)，关键分支在119行。隔离探针将存储中的角色设为禁用且空权限，两种管理员仍得到上述权限。
- **验收**：超级管理员保留其既定规则；普通管理员必须绑定自己的成员、角色、部门和权限，不借用超级管理员身份。

### AUTH-06 [P1] CSV 导入显示的角色与实际分配角色不一致
- **触发及问题**：CSV 写“投手”或“剪辑”会作为角色名称显示，但实际 `roleIds` 取固定候选角色，可能多授或少授权限。
- **证据**：[导入解析](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:1075)；[固定角色ID与输入角色名分别赋值](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:1094)。
- **验收**：输入角色必须解析为同一个真实角色ID；不存在、禁用或有歧义的角色应逐行报错，不能显示一个角色却按另一个角色执行。

### AUTH-07 [P2] 修改密码、重置密码及下次强制修改没有实际生效
- **触发及问题**：用户端、管理端的修改密码只检查非空和长度，不验证旧密码、不保存新密码；管理端单个／批量重置也只生成文字并提示。勾选“下次登录强制修改”没有对应登录分支。
- **证据**：[共用改密处理](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/ChangePasswordModal.tsx:25)；[重置密码](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:988)；[批量重置](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:1026)；[仍校验固定密码](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/LoginView.tsx:56)。
- **验收**：模拟账号也必须旧密码错误被拒绝、新密码可用、旧密码失效；重置后的首次登录按勾选规则处理，取消不修改凭据。

### AUTH-08 [P2] 邀请链接不是本平台的入职／加入流程
- **触发及问题**：生成的是参考平台 `sucaicloud.com` 域名链接；选择部门和角色不会完整更新链接参数，没有本地加入页、角色绑定或“7天有效”判断。
- **证据**：[邀请生成](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:1041)；[部门角色选择与7天提示](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:5125)。
- **验收**：一期若保留邀请入口，应在本地模拟完成待加入、加入成功、部门角色落位、过期与重复使用处理；不能向参考平台发送真实资料。

### AUTH-09 [P2] 成员新增／导入缺少重复身份和格式校验
- **触发及问题**：手动录入主要按手机号长度放行；导入不核对重复手机号，员工编号每次由相同起点生成；CSV直接按逗号拆分，带引号的逗号字段会错位。
- **证据**：[手动校验](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:900)；[CSV解析](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:1075)；[导入成员生成](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:1090)。
- **验收**：同批和跨批导入都检查唯一字段，合法CSV用结构化解析；逐行指出错误，失败行不能导致其他记录被错误覆盖。哪些字段唯一需在修复时明确。

### AUTH-10 [P2] 删除部门会遗留失去上级的小组及其成员
- **触发及问题**：删除有子小组的部门，只移动直接挂在部门下的成员并移除部门，未处理子小组和其成员；统计解析可能落入“未归属部门”。
- **证据**：[部门删除](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:758)；[组织归属解析](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/lib/analyticsOrganization.ts:43)。
- **验收**：复用已有组织树，在操作前展示受影响对象；迁移或阻止删除规则确认后执行，不留下悬空上级ID或错误统计归属。

### AUTH-11 [P2] 删除已分配的自定义角色会留下无效成员角色引用
- **触发及问题**：给成员分配自定义角色，再删除该角色，只从角色集合删除，不检查或迁移成员 `roleIds`。
- **证据**：[成员角色赋值](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:942)；[角色删除](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:1234)。
- **验收**：已关联角色必须先明确替代或拒绝删除；删除完成后成员实际权限与角色显示一致。预设角色不可删除的现有保护应保留。

### AUTH-12 [P2] 角色关联人数不随成员分配变化
- **触发及问题**：角色人数来自固定初值，新建和复制为零；新增成员、改角色、注销成员没有同步更新角色人数。
- **证据**：[静态人数](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:298)；[成员保存](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:905)；[显示关联人数](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:2912)。
- **验收**：从当前成员关联关系计算人数，新增、调岗、注销后实时一致，不另维护一套手填计数。

### AUTH-13 [P2] 权限树不能完整表达已经存在的管理能力
- **触发及问题**：内容管理已有“脚本状态”但缺少对应权限项；“人员账号管理”“操作记录”的查看权限是父节点，保存只保留叶子，无法独立表达“可看但不可导出”；资源管理权限明确写“不包含删除类”，却缺少匹配的管理端删除／恢复授权项。
- **证据**：[脚本状态入口](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminView.tsx:64)；[管理权限定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:208)；[仅取叶子](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:246)；[只读预设引用父节点](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:278)；[资源删除](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminResourceView.tsx:491)。
- **验收**：先明确这些现有操作复用哪个既有权限或是否拆项，再统一配置、显示和执行；不能自行扩建新的权限模块。

## 三、资源库与内容配置

### RES-01 [P1] 上传时设置的资源可见范围被丢弃
- **触发及问题**：发布时选择部门、分组或指定范围，相关权限和定时变更参数没有进入资源记录，后续页面无法按设置区分访问。
- **证据**：[视频可见配置](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/UploadFinishedVideoModal.tsx:326)；[脚本配置](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/UploadScriptPage.tsx:60)；[入库参数](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/lib/resourceUploads.ts:25)。图片、音频提交同样缺少这些字段。
- **验收**：使用已有可见范围发布，切换身份后列表、详情、选择器一致；与AUTH-03的人员数据范围是不同层级，最终应共同约束访问。

### RES-02 [P1] 管理端五类资源与用户端不是同一批记录
- **触发及问题**：除第三方外，用户新上传内容不进入对应管理列表；管理端删除、恢复、彻底删除只改自己的样例数组，切页重建。
- **证据**：[用户上传写入](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/lib/resourceUploads.ts:53)；[仅合并第三方上传](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminResourceView.tsx:281)；[管理端恢复](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminResourceView.tsx:561)。
- **验收**：六类资源逐一完成上传、后台定位、删除、恢复、彻底删除，全程使用同一ID；可复用第三方已有共享生命周期。

### RES-03 [P1] 非第三方资源的用户端删除未闭环
- **触发及问题**：成片、素材详情未接删除回调；图片删除只提示；脚本、音频删除只作用当前页样例，新上传记录不受影响，重进还会出现，且不进入共享回收站。
- **证据**：[成片详情调用](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/FinishedVideosView.tsx:496)；[素材详情调用](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/MaterialsView.tsx:1011)；[删除处理](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/FinishedVideoDetailModal.tsx:2795)；[图片删除](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/ImageDetailView.tsx:398)；[脚本删除](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/ScriptManagementView.tsx:613)；[音频删除](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AudioManagementView.tsx:728)。
- **验收**：样例和新上传数据均正确删除，切页不复现，后台可恢复；取消、无权、重复删除均有准确反馈。

### RES-04 [P1] 上传关联项丢失，资源详情反而补入固定关联
- **触发及问题**：选定任务或脚本后发布未提交关联ID；成片、素材、第三方又补入默认演示关联，造成“我没选却有关联，选的却没保存”。
- **证据**：[关联选择](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/UploadFinishedVideoModal.tsx:270)；[发布参数](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/UploadFinishedVideoModal.tsx:362)；[固定关联补全](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/lib/useFinishedVideos.ts:26)；[素材和第三方关联补全](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/MaterialsView.tsx:653)。
- **验收**：选A就展示A，未选为空；脚本详情上传作品也进入已有资源入库流程，而非仅追加当前页面对象。

### RES-05 [P1] 动态脚本模板未贯通发布后的内容展示
- **触发及问题**：模板可以驱动表单，发布却把整个快照序列化为正文；详情直接展示JSON并补入其他演示文案，分镜数固定为零。
- **证据**：[模板快照](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/DynamicScriptTemplateForm.tsx:246)；[发布](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/UploadScriptPage.tsx:74)；[脚本转换](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/lib/resourceUploads.ts:70)；[详情内容](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/ScriptDetailPage.tsx:202)。
- **验收**：模板新增字段并填写两行分镜，列表计数、详情、复制内容均与实际填写一致；历史脚本按发布时模板快照显示。

### RES-06 [P1] 修改脚本的视频关联会覆盖已有图片关联
- **触发及问题**：选择器只初始化视频，确认时却用所选视频替换整个作品集合；原图片关联消失。主动清空后，重开还会补回示例作品。
- **证据**：[仅初始化视频](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/ScriptDetailPage.tsx:2220)；[整体覆盖](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/ScriptDetailPage.tsx:537)；[空关联回填](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/ScriptDetailPage.tsx:211)。
- **验收**：编辑一种类型保留其他类型；清空后保持空状态，取消不改变原关联。

### RES-07 [P2] 标签的单选、适用分类和必填规则没有约束操作
- **触发及问题**：配置保存了规则，但用户端消费的是名称字典；单选仍可多选，限定分类仍跨分类可选，必填也能跳过。
- **证据**：[规则保存](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/TagGroupManagementView.tsx:200)；[名称投影](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/lib/useResourceTags.ts:9)；[标签追加](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/ResourceTagModal.tsx:279)；[入库校验](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/lib/resourceUploads.ts:36)。
- **验收**：上传、单项编辑和批量添加共同使用现有规则；先选二级分类，再显示该分类下可用标签。

### RES-08 [P2] 多类详情改名退出后丢失
- **触发及问题**：视频、图片、音频改名仅更新详情局部状态；脚本改名仅写本页样例数组，新上传脚本不在其中，返回列表恢复原名。
- **证据**：[视频改名](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/FinishedVideoDetailModal.tsx:3949)；[图片改名](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/ImageDetailView.tsx:574)；[音频改名](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AudioDetailView.tsx:437)；[脚本回写](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/ScriptManagementView.tsx:609)。
- **验收**：样例与新上传资源都能保存，列表、搜索、重开详情及选择器显示相同名称。

### RES-09 [P2] 关联选择器没有读取当前资源库
- **触发及问题**：新上传脚本不能在“关联脚本”选到，新上传视频也不进入固定视频／作品候选集。
- **证据**：[脚本候选](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/LinkScriptModal.tsx:181)；[视频候选](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/FinishedVideoDetailModal.tsx:1137)；[作品候选](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/ScriptDetailPage.tsx:529)。
- **验收**：上传、改名、删除、恢复后候选同步；复用当前资源集合并遵守相同可见范围。

### RES-10 [P2] 上传新版为空操作，切换版本不切换文件
- **触发及问题**：“上传新版”调用空提示函数；版本下拉只换标签，播放器始终引用同一URL。
- **证据**：[空提示函数](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/FinishedVideoDetailModal.tsx:1264)；[版本操作](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/FinishedVideoDetailModal.tsx:1317)；[播放源](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/FinishedVideoDetailModal.tsx:1424)。
- **验收**：上传B版后A/B分别播放对应文件，重开可定位版本；失败和取消不能产生虚假版本。

### RES-11 [P2] 图片批量操作及图片／音频下载只显示提示
- **触发及问题**：图片批量修改、加标签没有进入实际编辑；图片详情和音频批量下载未触发文件下载。
- **证据**：[图片批量操作](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/ImageManagementView.tsx:568)；[图片下载](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/ImageDetailView.tsx:414)；[音频批量下载](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AudioManagementView.tsx:683)。
- **验收**：复用已有分类、标签弹框及下载能力，只处理勾选资源；失败不能报全部成功，未勾选有明确状态。

### RES-12 [P2] 音频详情未播放上传的实际音频文件
- **触发及问题**：上传保留URL，详情却只有定时器，没有对应音频播放对象；上传记录时长为零，点击播放很快归零。
- **证据**：[音频文件URL](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/UploadGenericResourcePage.tsx:163)；[音频转换](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/lib/resourceUploads.ts:65)；[模拟计时播放器](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AudioDetailView.tsx:90)。
- **验收**：上传一段本地音频后，播放、暂停、进度、静音、倍速作用于同一文件；加载失败有反馈。

### RES-13 [P2] 图片、音频命名配置不生效
- **触发及问题**：图片填写统一标题仍按原文件名入库；音频选择自定义／前缀模式没有对应输入，发布仍用原文件名。
- **证据**：[图片命名配置](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/UploadImageModal.tsx:104)；[图片发布](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/UploadImageModal.tsx:214)；[音频命名选项](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/UploadGenericResourcePage.tsx:293)。
- **验收**：复用视频已有命名能力，各命名模式在预览名称、入库和详情中一致，必要输入缺失时阻止发布。

### RES-14 [P2] “相同配置继续上传”实际仍关闭上传页
- **触发及问题**：视频仅把模式写进提示文字；脚本、音频直接关闭；图片虽提示保留配置，父组件仍无条件退出。
- **证据**：[视频发布反馈](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/UploadFinishedVideoModal.tsx:366)；[脚本关闭](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/UploadScriptPage.tsx:83)；[音频关闭](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/UploadGenericResourcePage.tsx:165)；[图片父级回调](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/ResourcesView.tsx:345)。
- **验收**：连续发布两批时配置保留、已发布文件清空、不重复入库；普通发布按原路径返回列表。

### RES-15 [P2] 工程文件与访问范围只保留在当前详情
- **触发及问题**：上传附件、修改私密范围后退出重开恢复固定样例；不同视频初始化同一份附件，没有按资源ID存储。
- **证据**：[附件初始化](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/FinishedVideoDetailModal.tsx:1103)；[范围修改](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/FinishedVideoDetailModal.tsx:3499)；[上传回写](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/FinishedVideoDetailModal.tsx:4691)。
- **验收**：视频A的附件及范围重开保留，不串到视频B；沿用现有访问范围与下载权限。


### RES-16 [P2] 个人中心“我的资源”点击查看只有提示，没有详情
- **触发及问题**：在个人中心点击视频、图片、音频或脚本，只提示“正在查看”，没有打开已有资源详情；用户必须再回资源库重新查找。
- **证据**：[个人资源入口](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/CreditsDashboard.tsx:148)；[各类资源onOpen均为Toast](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/PersonalResourceCenterV2.tsx:540)。
- **验收**：复用资源库现有按类型详情和定位能力，打开同一个资源ID；删除或无权时准确反馈，不新增一套个人详情。


## 四、爆款复刻、任务与积分

### CRT-01 [P1] 企业积分与个人消费账本断开，充值离页丢失
- **触发及问题**：生成只更新用户侧个人流水；管理端独立生成示例账本，充值只修改本页状态。用户消费不影响企业余额，离开再进入充值记录消失。
- **证据**：[个人消费](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/App.tsx:1233)；[独立账本](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminCreditsManagementView.tsx:155)；[充值处理](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminCreditsManagementView.tsx:267)。
- **验收**：一次消费、充值或退款同时反映在企业余额、个人明细、管理端汇总中；跨页面保留，重复点击不重复记账。

### CRT-02 [P1] 个性化额度与个人资料没有使用当前登录成员
- **触发及问题**：给普通用户配置额度，消费端却始终查询“徐振”；个人资料也固定显示徐振。管理端个人中心同样固定显示超级管理员资料。
- **证据**：[个人额度配置](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminCreditsManagementView.tsx:904)；[固定额度身份](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/App.tsx:276)；[个人资料](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/CreditsDashboard.tsx:154)；[管理端资料](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminProfileView.tsx:55)。
- **验收**：复用已有成员映射，身份、部门、角色、日／月额度和消费校验均对应当前账号。
- **同源影响**：个人资源也以固定徐振过滤上传数据，见 [固定CURRENT_USER](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/PersonalResourceCenterV2.tsx:41) 和 [我的资源过滤](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/PersonalResourceCenterV2.tsx:245)，需一并使用当前成员。

### CRT-03 [P1] 退出后换账号会继承上一个人的任务和积分流水
- **触发及问题**：退出仅清会话和导航，没有切换个人任务、余额和流水集合；任务队列直接消费原来的全部任务。
- **证据**：[退出处理](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/App.tsx:249)；[积分与任务状态](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/App.tsx:261)；[任务队列输入](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/App.tsx:1685)。
- **验收**：A创建并消费后，B不能继承A的个人任务或使用量；A重新登录能恢复自己的状态，管理角色的跨人查看另按既有权限执行。

### CRT-04 [P1] 刷新重置消费和历史任务，已保存复刻失去入口
- **触发及问题**：复刻内容已有存档，但余额、流水、任务索引和活动会话刷新后回到初值；日用量可归零，新任务不再出现在历史列表。
- **证据**：[复刻存档](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/VideoRemakeView.tsx:606)；[活动会话初值](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/App.tsx:156)；[流水任务初值](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/App.tsx:261)。
- **验收**：复用存档恢复对应任务和账本，刷新前后日／月已用额度、历史入口、结果一致。本项是现有保存及限额链路自相矛盾，不等于要求所有模拟媒体永久保存。

### CRT-05 [P1] 完整视频下载和入库未连接有效视频结果
- **触发及问题**：完整视频下载指向当前分镜图片封面；入库仅传文件名，发布组件因此构造空文件并写入其URL。
- **证据**：[完整视频下载](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/VideoRemakeView.tsx:1788)；[入库参数](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/VideoRemakeView.tsx:1021)；[空文件创建](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/UploadFinishedVideoModal.tsx:340)；[入库URL](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/UploadFinishedVideoModal.tsx:364)。
- **验收**：允许固定的有效模拟MP4，但预览、下载、入库和后续推送选择必须指向同一视频；不能将图片或空文件当成生成成片。

### CRT-06 [P1] UTC流水与本地额度日期混用，凌晨消费不计入当天
- **触发及问题**：流水用UTC时间后去掉时区，额度按本地日期计算；北京时间9月28日01:00会写成27日消费，月初同样影响月额度。
- **证据**：[消费时间](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/App.tsx:1239)；[本地日期额度匹配](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/lib/creditQuota.ts:98)；[已有localCreditTime](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/lib/creditConsumption.ts:39)。
- **验收**：统一业务时区，测试本地00:00、08:00、跨月和退款日期；同一笔消费只能计入正确的一个日／月区间。

### CRT-07 [P2] 复刻入库双写，个人资源出现额外记录
- **触发及问题**：发布组件已按填写配置入库，复刻回调再次追加固定标题和封面的另一条资源，个人资源合并两路数据。
- **证据**：[第一次入库](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/UploadFinishedVideoModal.tsx:362)；[成功回调](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/VideoRemakeView.tsx:1024)；[第二次追加](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/App.tsx:1300)；[两路合并](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/PersonalResourceCenterV2.tsx:245)。
- **验收**：一次发布只产生一个资源ID，复用发布结果；各入口命名、分类、标签、媒体一致。

### CRT-08 [P2] 个性化额度负数被转换为“不限”
- **触发及问题**：保存规则只校验名称；负数进入消费逻辑后压为0，0又解释成无限额度。
- **证据**：[规则保存](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminCreditsManagementView.tsx:194)；[负数归零](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/lib/creditQuota.ts:91)；[零转不限](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/lib/creditQuota.ts:112)。
- **验收**：负数、非法值拒绝保存；只有明确输入合法的0才按现有“不限”含义处理，日／月规则一致。

### CRT-09 [P2] 编辑个人规则会顺带提交尚未保存的全局额度
- **触发及问题**：先修改全局输入但不保存，再启停、编辑或删除个人规则，会将当前全局草稿一并持久化，影响所有用户。
- **证据**：[全局草稿](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminCreditsManagementView.tsx:448)；[个人规则保存携带草稿](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminCreditsManagementView.tsx:248)；[订阅生效](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/App.tsx:266)。
- **验收**：不同配置区的草稿独立，未点击全局保存不得影响生效值；取消或离页不隐式提交。

### CRT-10 [P2] 分镜模型选择没有进入生成任务
- **触发及问题**：模型下拉仅改子组件状态，生成只传分镜；解析弹框的模型也只出现在完成提示。重进恢复默认，不能核对实际选择。
- **证据**：[模型选择](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/VideoRemakeView.tsx:1661)；[生成调用](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/VideoRemakeView.tsx:1670)；[任务处理](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/VideoRemakeView.tsx:844)；[解析模型反馈](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/VideoRemakeView.tsx:811)。
- **验收**：沿用现有模型选择，将模型保存到模拟任务、历史版本和重试参数；不要求真实AI接入。

### CRT-11 [P2] 自定义角色提示词恢复时被模板覆盖
- **触发及问题**：只要自定义内容不含固定文本“- 时代基底：”，恢复函数就用模板替换，误将正常用户编辑当作旧数据。
- **证据**：[提示词编辑](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/VideoRemakeView.tsx:1357)；[恢复替换逻辑](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/VideoRemakeView.tsx:447)。
- **验收**：输入任意描述，离页后通过历史任务返回，逐字保留；数据迁移不能依赖用户文案中是否含固定句子。

### CRT-12 [P2] 切换历史分镜版本只恢复封面，不恢复生成参数
- **触发及问题**：历史版本只保存封面和时间；切回旧版不恢复时长、格式等，成片时间轴仍用当前值。
- **证据**：[历史版本保存](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/VideoRemakeView.tsx:856)；[历史版本切换](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/VideoRemakeView.tsx:1586)；[成片时间轴](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/VideoRemakeView.tsx:1687)。
- **验收**：先生成4秒版本，再生成30秒版本；切回旧版时，文件、时长及生成参数和时间轴一致，不修改其他分镜。

## 五、广告账户、投放与分析

### ADS-01 [P1] 账户授权按姓名／小组名匹配，改名失效，同名可能串权
- **触发及问题**：绑定选择时有成员ID，保存却只存姓名与组名；权限按这些可变名称比较。成员改名后失配，不同部门同名组或同名人可能取得不应有的账户范围。
- **证据**：[绑定保存](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/lib/adAccountManagement.ts:59)；[账户可见性判断](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/lib/adPush.ts:138)。
- **验收**：用既有成员、组织ID绑定，名称只负责显示；改名不丢授权，同名不串权，删除对象后按规则失效。

### ADS-02 [P1] 广告账户可见范围没有覆盖用户报表与导出
- **触发及问题**：推送页看不到的账户仍可能出现在账户报表、标签分析和导出；报表生成读取全量账户，没有经过相同过滤。
- **证据**：[账户可见配置保存](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:3437)；[全量账户生成事实](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/lib/useReportData.ts:15)；[导出事实读取](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdAccountDataView.tsx:512)。
- **验收**：用户侧列表、候选、汇总、图表、导出都复用已有账户可见范围；不得用隐藏表格行代替真正过滤数据。

### ADS-03 [P2] 人员绑定、广告主管理绑定和统计归属三处断联
- **触发及问题**：人员页固定账户选项只写 `boundAccount`，推送不读取；广告主管理另写用户／组／分类；报表只按用户找组织、按账户ID生成分类，单绑组或改分类不正确反映。
- **证据**：[人员绑定保存](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:946)；[固定账户选项](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:5096)；[广告主管理绑定](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/lib/adAccountManagement.ts:51)；[统计分类和归属](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/lib/reportDemoData.ts:23)。
- **验收**：复用已有广告账户绑定来源，两入口一致回显；仅绑定组、绑定人和改分类都能在相应报表验证。

### ADS-04 [P2] 新建计划和状态核查没有进入投放状态报表
- **触发及问题**：推送已将计划及状态写进账户目录，报表却固定为每账户独立生成8个计划；本地创建和核查不影响对应数量与状态。
- **证据**：[计划写入](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/lib/adPush.ts:745)；[状态更新](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/lib/adPush.ts:635)；[独立生成计划](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/lib/reportDemoData.ts:26)。
- **验收**：新建增加同一计划记录，追加素材不增加计划数，核查状态同步到图表和明细；不要求新计划立刻产生模拟消耗。

### ADS-05 [P2] 广告平台分析切换推广方式未切换基础数据
- **触发及问题**：平台和推广方式控件变化，底层仍是没有平台／推广类型字段的同一个RAW集合，导出只更换筛选标签；组织人员也独立写死。
- **证据**：[过滤基础数据](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdPlatformAnalysisView.tsx:343)；[平台切换](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdPlatformAnalysisView.tsx:482)；[推广方式切换](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdPlatformAnalysisView.tsx:506)。
- **验收**：优先修复千川标准／全域等当前保留视图；页面、合计、导出共同消费带正确维度的模拟明细。不据此新增巨量广告投放功能。

### ADS-06 [P2] 广告平台分析的人员、日期、查询和普通预览存在空操作
- **触发及问题**：人员选择无状态绑定且各维度都填团队选项；日期是静态文字；查询只弹成功；普通样例没有资源ID，预览只提示视频名。
- **证据**：[人员选择](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdPlatformAnalysisView.tsx:553)；[日期](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdPlatformAnalysisView.tsx:569)；[查询](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdPlatformAnalysisView.tsx:586)；[预览](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdPlatformAnalysisView.tsx:651)。
- **验收**：复用部门、分组、个人选择与日期控件，点击查询后应用，重置按既定默认日期及空选择处理；预览对应真实样例媒体或准确提示不可用。“团队”统一为“部门”。

### ADS-07 [P2] 广告平台分析默认导出与屏幕数据范围不一致
- **触发及问题**：本地零点转UTC截日会出现前一日数据；表格不按显示日期过滤，默认导出另有固定起止日期，新衍生记录也可能落在导出之外。
- **证据**：[日期构造](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdPlatformAnalysisView.tsx:114)；[默认导出日期](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdPlatformAnalysisView.tsx:444)；[导出范围](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdPlatformAnalysisView.tsx:455)。
- **验收**：统一时区与已应用查询条件；不改导出条件时，文件明细重算的合计与页面完全一致，名称使用已确认的命名规则。

### ADS-08 [P2] “已暂停”被统计成“已终止”，与说明矛盾
- **触发及问题**：提示将暂停归入未投放，计算却归入terminated而非pending，图表与业务释义不一致。
- **证据**：[状态说明](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/DeliveryStatusReportView.tsx:30)；[状态聚合](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/lib/reportDemoData.ts:100)。
- **验收**：先统一暂停、未投放、终止的含义，再同步提示、筛选、图表、表格、导出；不得把暂停和终止混用。

### ADS-09 [P2] 替换任务把已确认的审核通过改回待确认
- **触发及问题**：追加并移除旧素材时，核查先得到“审核通过、未投放”；因为尚无DELIVERY_OK而保留旧素材，后续又覆盖素材审核字段为待确认。
- **证据**：[核查确认审核](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/lib/adPush.ts:622)；[替换保护分支](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/lib/adPush.ts:767)；[审核字段回写](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/lib/adPush.ts:788)；[结果显示](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdAccountPush.tsx:122)。
- **验收**：保留“审核通过”，单独表达“可投状态待确认／旧素材保留”；后续查询失败不得抹去已确认的审核事实。

## 六、全局系统配置

以下各项与具体资源记录权限、角色权限分开记录：这里的问题是“管理配置本身没有保存／没有业务读取”。

### SYS-01 [P2] 七个可见功能开关均未形成业务效果
- **触发及问题**：切换分类搜索、图片下载记录、文案下载记录、成片消耗展示、成片手动关联素材、剪辑时间必填、拍摄时间必填后保存，只弹成功；值停留在组件状态，用户端没有读取。
- **证据**：[开关状态](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:1618)；[七个可见开关](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:3505)；[保存仅提示](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:3540)。
- **验收**：保留项应逐项验证开关前后差异、跨页面保存、提交校验及记录产生；不存在于一期的“文案”单独配置需清理或明确映射，不可继续留空开关。

### SYS-02 [P2] 发布多少天后开放查看的规则不生效
- **触发及问题**：按资源类型和人员范围填天数后，只存局部状态，保存不持久化，列表／详情没有时间判定。
- **证据**：[viewRules](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:1639)；[规则表](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:3630)；[保存提示](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:3703)。
- **验收**：复用已有资源与组织字段，模拟发布前后时间验证边界；管理员规则与资源单独可见范围的优先级需确认后统一。

### SYS-03 [P2] 发布可见性“允许项”未限制上传选项
- **触发及问题**：取消允许“公开”等选项，上传页面仍固定显示并接受，提交没有再次校验。
- **证据**：[publishVisibility](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:1674)；[允许项配置](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:3920)；[视频上传固定选项](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/UploadFinishedVideoModal.tsx:1299)；[图片上传固定选项](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/UploadImageModal.tsx:1077)。
- **验收**：取消项不再提供，新提交不能沿用失效选项；历史记录如何处理需明示，不能静默改变范围。

### SYS-04 [P2] 外网权限配置及指定范围未接实际组织或业务
- **触发及问题**：登录、下载、编辑、删除的外网策略只在本页保存提示；指定部门、小组和用户来自固定样例，无网络上下文或模拟判断消费这些值。
- **证据**：[外网状态](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:1657)；[配置界面](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:3762)；[固定组织候选](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:3816)；[保存提示](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:3911)。
- **验收**：一期若保留，应有明确的内外网模拟状态和组织范围选择，触发允许／拒绝结果；真实IP识别和服务端防绕过另属生产实现，不能用前端控件宣称已完成。

### SYS-05 [P2] 推送成功自动改视频状态未生效
- **触发及问题**：开启后推送成功不读取该配置；目标状态也是固定选项，不与已有视频状态管理联动。
- **证据**：[自动状态配置](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:1690)；[可见入口](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:4084)；[固定目标状态](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:4116)；[保存提示](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:4129)。
- **验收**：先明确“成功”指素材推送成功还是计划创建／投放成功，然后只在该事件修改对应资源状态；关掉不修改，目标候选复用状态目录。

### SYS-06 [P2] 水印配置未应用，图片水印上传入口也为空
- **触发及问题**：文字、位置等只改本页状态，保存仅提示；PNG上传区域没有文件输入或点击处理，切到图片仍预览文字，资源展示／下载未读取配置。
- **证据**：[水印状态](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:1576)；[PNG区域](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:3353)；[保存提示](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:3391)；[预览仍为文字](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:3419)。
- **验收**：沿用当前入口完成上传、预览、保存及既定媒体应用范围；下载原件与带水印版本的权限和结果要一致，不自行扩大水印适用范围。

### SYS-07 [P2] 系统自动化保护标签规则没有执行端
- **触发及问题**：规则、指定范围和阈值只在页面状态中；分类候选是独立样例，保存后没有规则计算或标签写入。
- **证据**：[保护标签状态](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:1698)；[独立分类](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:1711)；[规则入口](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:4190)；[保存提示](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:4322)。
- **验收**：复用当前分类与标签目录，用达标和不达标样例验证添加、停用、修改后的效果。已有“爆款规则”有独立保存和消费链路，不能与此项混为一谈。

## 七、管理端审计与登录记录

### AUD-01 [P2] 管理操作没有进入管理端操作记录
- **触发及问题**：新增／修改／删除部门、成员和角色等调用的审计函数只console.log；操作记录页始终是固定样例。
- **证据**：[appendAuditLog](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:627)；[固定审计数据](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:1501)。
- **验收**：实际管理动作产生准确的操作者、对象、时间、结果记录；用户侧已有事件模型可评估复用，取消和失败不能记录成成功。

### AUD-02 [P2] 审计日期筛选被忽略，“当日”不是按当前日期计算
- **触发及问题**：查询保留了起止日期，但过滤没有用；2025年的固定记录用isToday=true显示在当日页。
- **证据**：[已应用筛选](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:1469)；[固定日期与当日标记](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:1503)；[未使用日期过滤](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:1527)。
- **验收**：当前日按业务时区计算，历史起止时间真实过滤；重置、空结果、边界时间一致。

### AUD-03 [P2] 管理端操作记录导出只提示成功，没有生成文件
- **触发及问题**：点击CSV或Excel导出没有生成Blob、下载或导出记录，仅Toast。
- **证据**：[handleExportFile](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:1522)；[CSV入口](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:3224)；[Excel入口](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:3231)。
- **验收**：复用已有分析导出能力，实际文件可打开且符合当前筛选；人员名单已有真实下载，不属于本项。

### AUD-04 [P2] 管理端登录记录没有读取实际登录事件
- **触发及问题**：登录成功／失败已有事件记录，但管理端展示另一个固定三行数组，无法看到刚发生的登录。
- **证据**：[固定登录样例](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:1983)；[列表显示](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:4937)；[登录事件](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/App.tsx:226)；[现有登录记录](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/lib/operationHistory.ts:27)。
- **验收**：模拟成功、失败、退出后重登，记录显示真实演示账号、时间和结果；固定样例不能掩盖新事件。

## 八、已删除业务的可见残留

### SCOPE-01 [P2] 消息中心、个人资源仍展示已移除的业务
- **触发及问题**：虽然主导航移除了任务协作和直播，消息初值仍含这些业务并出现在“全部消息”；详情还有指向已删除页面的跳转。已取消申请积分，但消息中心仍保留积分审批分类、样例和审批操作。个人资源还显示“绑定任务”、协作上传筛选和协作任务弹框。
- **证据**：[积分审批分类与消息](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/data.ts:3)；[协作任务消息与旧跳转](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/data.ts:48)；[直接载入消息](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/App.tsx:274)；[按旧actionScreen跳转](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/MessageCenterWorkspace.tsx:118)；[积分审批操作](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/MessageCenterWorkspace.tsx:249)；[绑定任务按钮](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/PersonalResourceCenterV2.tsx:404)；[协作来源筛选](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/PersonalResourceCenterV2.tsx:518)。
- **验收**：依据已确认的一期删减范围，清理旧业务消息、按钮、弹框、来源、回调和类型引用；保留当前复刻生成任务、推送队列和创建计划队列，不能因为都叫“任务”而误删。

## 九、配置与业务效果对照

本表用于后续逐项排查，不另增加问题数量。“部分联动”不代表整体通过。

| 管理端配置 | 当前保存／消费情况 | 对应问题或结论 |
| --- | --- | --- |
| 角色用户端权限 | 角色可保存，绝大部分入口未读取；推送、计划、衍生有局部检查 | AUTH-01 |
| 角色管理端权限 | 角色可保存，菜单与多数动作未统一限制 | AUTH-02、AUTH-05 |
| 本人／部门／全部数据范围 | 有字段与回显，没有统一过滤 | AUTH-03 |
| 部门、小组、成员 | 有共享组织数据；登录、删除迁移、人数存在断点 | AUTH-04、AUTH-09 至 AUTH-12 |
| 分类管理 | 已驱动资源分类控件，有关联删除保护 | 已有可复用链路 |
| 视频状态、脚本状态 | 名称、颜色、排序、启停和替代删除已有共享消费 | 状态目录有效；AUTH-13是权限缺口 |
| 标签名称与标签组 | 名称增删改按ID同步；规则未完整读取 | RES-07 |
| 标签单选／多选 | 操作未按规则限制 | RES-07 |
| 标签适用分类 | 仍可跨分类选择 | RES-07 |
| 标签必填 | 提交可跳过 | RES-07 |
| 脚本模板启停及字段定义 | 能影响填写页；发布后详情没接完整快照 | RES-05 |
| 企业充值、积分账本 | 独立页面状态，未与个人消费统一 | CRT-01 |
| 全局日／月额度 | 保存能通知消费端；用户身份、草稿和时间有问题 | CRT-02、CRT-06、CRT-09 |
| 个人额度规则 | 可保存；当前用户不匹配，负值可变不限 | CRT-02、CRT-08 |
| 广告账户可见性 | 持久化且影响推送候选；报表导出未统一使用 | ADS-02 |
| 广告账户小组／用户／分类绑定 | 可以保存；名称关联、人员入口和报表归属不一致 | ADS-01、ADS-03 |
| 广告平台标签统计开关 | 只保存syncPreferences偏好，无统计消费端 | D-03 |
| 达人同步素材开关 | 只保存偏好，无同步消费端 | D-03 |
| 同步过审素材开关 | 只保存偏好，无同步消费端 | D-03 |
| 同步素材关联抖音视频数据开关 | 只保存偏好，无同步消费端 | D-03 |
| 同步评论开关 | 只保存偏好，无同步消费端 | D-03 |
| 分类搜索开关 | 局部状态、保存Toast，无业务读取 | SYS-01 |
| 图片下载操作记录开关 | 同上 | SYS-01 |
| 文案下载操作记录开关 | 同上；一期“文案”作为独立类型缺乏对应模块 | SYS-01及非活动范围清理 |
| 成片列表展示消耗数据开关 | 局部状态、保存Toast，无业务读取 | SYS-01 |
| 成片手动关联素材开关 | 同上 | SYS-01 |
| 上传成片剪辑时间必填 | 同上，无提交校验 | SYS-01 |
| 上传素材拍摄时间必填 | 同上，无提交校验 | SYS-01 |
| 分资源类型、人员范围的延迟公开天数 | 局部状态，无可见性消费端 | SYS-02 |
| 发布可见性允许项 | 局部状态，上传仍用固定选项 | SYS-03 |
| 外网登录／下载／编辑／删除 | 局部状态，组织候选固定，无判断消费端 | SYS-04 |
| 推送成功自动改状态 | 局部状态，未接推送事件，目标状态固定 | SYS-05 |
| 水印 | 局部状态；图片上传、实际应用缺失 | SYS-06 |
| 系统自动化保护标签 | 局部状态，无标签计算执行端 | SYS-07 |
| 爆款规则 | 有保存、校验和共享消费，不等同于保护标签 | 已有可复用链路 |
| 部门编制数上限 | 有显示和进度，但不限制新增／导入／迁入 | D-09 |

### 反向检查：已有功能但缺配置或配置表达不足

- **确定表达不足**：脚本状态权限、人员／审计只读权限、管理端资源删除／恢复权限，见AUTH-13。
- **已有配置但未接入，不应另造配置**：资源可见范围、角色权限、标签规则、日／月额度、广告账户可见性，应优先修复消费链路。
- **不能直接认定必须新增**：模型目录与积分价格配置、回收站自动保留期、消息留存配置，属于D-02、D-05、D-06，不自行新增页面。
- **优先解决领域规则而非加开关**：重复身份、删除组织迁移、删除角色替代、取消／退款口径，都需要一致规则，但不必为每条规则新建管理配置。

## 十、待决策边界

当前仅登记，按用户要求本轮不逐条提问，不把建议视为已确认方案。

| 编号 | 查明事实 | 后续需要确认的边界 | 证据 |
| --- | --- | --- | --- |
| D-01 | 新复刻禁止取消、失败不退、重试再收费；旧示例却存在失败全退 | 哪些阶段可取消；按已完成步骤还是整单退；系统失败与用户取消是否不同 | [取消规则](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/VideoRemakeView.tsx:656)；[失败计费](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/VideoRemakeView.tsx:841)；[演示退款策略](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/data.ts:864) |
| D-02 | 模型和单价是代码常量，日／月额度不是价目表 | 一期是否需要管理员维护模型、启停和价格；还是先固定价目 | [图片价格](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/VideoRemakeView.tsx:216)；[分镜价格](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/VideoRemakeView.tsx:255) |
| D-03 | 五个同步／统计开关只有持久化偏好；既有文档也明确如此 | 一期仅保存偏好还是演示开关控制的同步结果；当前“已开启”提示不能被当作已执行同步 | [五项开关](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/lib/adAccountManagement.ts:5)；[同步函数](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/lib/adAccountAuthorization.ts:63)；[已有边界](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/docs/advertiser-management-screenshot-alignment.md:23) |
| D-04 | 绑定弹框承诺只影响后续数据，但报表按当前绑定重算90天历史 | 一期是否演示绑定生效时间和历史归属快照；排除时需明确该承诺尚未演示 | [绑定提示](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdvertiserAccountControls.tsx:128)；[当前人员套用历史](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/lib/reportDemoData.ts:41)；[生产规则说明](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/docs/advertiser-management-screenshot-alignment.md:31) |
| D-05 | 用户操作记录存内存；导出文件仅本次访问Blob；其他本地资源和任务留存方式不同 | 明确刷新、退出、重启后的演示数据保留期限，导出文件是否需要重新下载；不能将本地URL当永久文件 | [内存记录](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/lib/operationHistory.ts:10)；[本次访问导出](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/lib/operationHistory.ts:53) |
| D-06 | 当前回收站有生命周期操作，没有已确认的统一自动保留期 | 一期是否保留手动管理即可；若自动清理，保留几天、是否提示恢复截止 | [恢复与回收站逻辑](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminResourceView.tsx:561) |
| D-07 | 关联选择和资源删除分散，目标失效后的统一含义尚未明确 | 关联目标删除时保留历史占位、自动解除还是禁止删除；恢复后是否恢复关系 | RES-03、RES-04、RES-06、RES-09所列证据 |
| D-08 | 脚本作品、视频关联脚本等从不同页面维护 | 一处关联是否要求另一处自动反向显示，哪些关系只是来源引用，哪些是双向关联 | [作品关联](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/ScriptDetailPage.tsx:537)；[脚本关联候选](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/LinkScriptModal.tsx:181) |
| D-09 | 编制数叫“上限”并显示进度，但新增、导入、迁入不拦截 | 只是统计指标还是实际人数限制；若硬限制，禁用成员是否占用名额 | [上限显示](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:2344)；[编制配置](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:5077) |

“清除关联”“取消”“重置”应沿用先前已确认交互，不因本审查自行改变。新增界面位置仍需先向用户确认。

## 十一、非活动代码与文档残留

以下不冒充“当前可见按钮失效”，也不与SCOPE-01重复计数：

1. **隐藏配置仍在源码**：下载／转码、延迟下载、延迟推送、批量下载告警等区块使用hidden。当前系统设置DOM没有这些内容，但并非彻底删除。证据：[隐藏转码区](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:3440)、[隐藏下载延迟](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:3549)、[隐藏推送延迟](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:3712)、[隐藏告警区](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:3966)。
2. **旧模块类型和处理函数残留**：一期App仍保留AI视频等非当前主导航业务的类型、校验和任务函数。源码存在不等于用户可访问，但会增加后续误接入口的风险。证据：[旧类型引用](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/App.tsx:42)、[旧AI视频处理](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/App.tsx:1035)。
3. **参考平台命名与历史文档**：CONTEXT.md仍混有参考平台和已移除领域描述；人员导出文件名也残留“云视频管家”。证据：[历史术语文档](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/CONTEXT.md:1)、[旧品牌文件名](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:1127)。不能把这些文字当成一期已实现范围。
4. **文案与脚本重复配置**：系统设置仍将“文案”和“脚本”分别列出，但一期资源分类为成片、素材、第三方、图片、音频、脚本。清理时需核对存量字段映射，避免误删脚本文本能力。

清理应基于可达性和实际数据依赖，保留当前推送中的直播推广目标，不因没有直播管理模块而误删已确认保留的千川直播投放场景。

## 十二、已存在的可复用闭环

以下是源码确认的有效链路及现有测试覆盖方向，不等于对每个浏览器组合完成验收：

| 已有能力 | 审查结论与复用价值 |
| --- | --- |
| 分类目录 | 配置可驱动用户分类选择，有关联删除保护；可复用修复其他固定分类候选 |
| 视频／脚本状态目录 | 名称、颜色、排序、启停和替代删除有共享消费 |
| 标签名称与ID | 增删改能通过ID投影同步；缺的是规则约束，不需重写整套标签体系 |
| 动态脚本模板 | 启停和字段定义已驱动填写页；应继续接发布快照和详情 |
| 第三方资源生命周期 | 已有用户端和管理端共享删除、恢复、彻底删除，可作为其他资源的复用基础 |
| 全局额度与生成前检查 | 配置保存会通知用户端，生成前已有额度判断；需纠正身份、时间和账本 |
| 分镜重试与入库门槛 | 单镜重试保留其他成功分镜，全部完成后才允许入库；不代表最终文件有效 |
| 广告授权模拟 | 拒绝、失败、空结果不接入；提交时重新校验身份、权限和候选 |
| 广告账户解除接入 | 保留历史，进行中任务会拦截解除 |
| 推送结果分层 | 已区分素材上传、计划创建、开启回执、审核与实际投放 |
| 写入未知与重试 | 已有核查锁定，重试保留完成步骤，视频／封面延迟有恢复路径 |
| 旧素材保护 | 替换场景已有先保留旧素材的保护，需修正ADS-09的状态显示覆盖 |
| 共享数据导出 | 已存在CSV／XLSX实际生成；账户数据、标签分析会消费已应用筛选，需叠加访问范围 |

## 十三、真实接口与生产验证事项

这些事项与62项本地原型问题分开，不得以“缺真实后端”为由掩盖本地空操作，也不得以“原型演示成功”证明生产可用。

1. **千川账户与授权**：真实OAuth授权范围、商家／达人／机构账户能力、token刷新、撤销授权与重新接入，需用实际应用权限核对。
2. **素材闭环**：视频、封面上传，媒体格式大小限制、异步入库、重复素材复用和审核查询，需核对具体端点和响应字段。
3. **投放闭环**：各推广目标的创建、追加、请求开启、预算／出价／商品／身份等必填条件须逐目标建立字段映射，不能由一条创建接口推导所有能力。
4. **状态与异常**：接口接受请求、审核通过、计划开启与真实投放是不同事实；超时结果未知、限流、部分失败、授权失效、重试幂等必须联调。
5. **替换旧素材**：新增与移除的接口能力、完整关联范围及可投确认，必须通过真实查询能力验证，不能只依赖本地模拟标记。
6. **全域授权初始化**：运营权限入口已有既定位置；真实可调用账户类型、错误原因、调用后重查结果需验证。
7. **报表／同步字段**：千川原生字段与本平台派生字段应分开。部门、小组、操作人、绑定归属属于本平台组织信息，不能标为千川直接返回；每个指标要有来源和聚合口径。
8. **AI与媒体**：真实生成结果、异步回调、取消能力、文件有效性及计费依据需联调；一期演示可以先用有效本地／样例媒体闭环。
9. **服务端保障**：权限、额度、凭据、文件持久化、事件审计和幂等必须最终在服务端执行。前端模拟仅用于验证交互和规则。

项目现有 [千川接口审查记录](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/docs/qianchuan-push-api-audit.md:1) 可继续作为对照清单，但本轮没有重新验证其全部在线结论。

## 十四、后续逐项处理方式

本轮没有确认具体修复设计，也没有修改业务代码。建议后续按依赖顺序讨论，每次只处理一个明确问题：

1. **身份与权限**：当前登录人、成员、角色、数据范围统一；随后修复广告账户授权ID与报表访问范围。
2. **资源基础数据**：统一两端记录、保存、可见范围、删除恢复和关联，然后接详情编辑、版本和个人资源详情。
3. **积分与复刻**：统一账本与额度日期，再完成有效视频结果、单次入库、历史恢复及模型参数保存。
4. **广告与分析**：绑定关系、计划目录、查询、聚合、导出用同一组事实，修正状态回退。
5. **管理配置与审计**：逐个开关接入消费端，操作日志记录真实演示动作，清理不存在的业务配置。
6. **回归验收**：每项完成后补充一个跨页面用例和至少一个失败／取消／无权／重复操作用例，检查既有页面复用和浮层规则。

### 每项关闭条件

- 指定问题编号和已确认范围，没有顺手扩展新页面或新模块。
- 入口、填写、提交、结果、详情、历史和异常使用同一业务对象。
- 保存和取消语义准确，失败不报成功，重试不重复生成资源／任务／账单。
- 角色与可见范围在操作执行时仍校验，导出不扩大查询权限。
- 管理配置的启用／停用能在用户端直接验证。
- 定向测试和必要浏览器流程通过，更新本清单状态及验收证据。
- 若新增界面无法确定放置位置，先单独询问用户。

## 附表：67个权限叶子项接入情况

来源为当前管理端权限树。下表的“未见业务接入”综合了源码引用、路由和动作检查，不是仅靠搜索次数推断；“有局部校验”仅表示已有消费位置，不代表角色身份、所有入口和数据范围均正确。分组标题可能重名，故保留权限ID供研发定位。

| 端侧 | 权限ID | 页面名称 | 现状 | 定义位置 |
| --- | --- | --- | --- | --- |
| 用户端 | `uc_remake_run` | 爆款复刻 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:106) |
| 用户端 | `uc_resource_view_finished` | 查看成片 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:111) |
| 用户端 | `uc_resource_view_material` | 查看素材 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:112) |
| 用户端 | `uc_resource_view_third_party` | 查看第三方 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:113) |
| 用户端 | `uc_resource_view_image` | 查看图片 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:114) |
| 用户端 | `uc_resource_view_audio` | 查看音频 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:115) |
| 用户端 | `uc_resource_view_script` | 查看脚本 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:116) |
| 用户端 | `uc_upload_video` | 上传视频 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:121) |
| 用户端 | `uc_upload_image` | 上传图片 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:122) |
| 用户端 | `uc_upload_script` | 上传脚本 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:123) |
| 用户端 | `uc_upload_audio` | 上传音频 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:124) |
| 用户端 | `uc_finished_edit` | 修改基础信息 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:131) |
| 用户端 | `uc_finished_status` | 修改状态 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:132) |
| 用户端 | `uc_finished_download` | 下载原片 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:133) |
| 用户端 | `uc_finished_logs` | 查看操作记录 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:134) |
| 用户端 | `uc_finished_ad_push` | 推送广告账户 | 有局部校验；通过别名uc_ad_push使用 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:135) |
| 用户端 | `uc_ad_plan_manage` | 管理投放计划 | 有局部校验；计划创建和恢复路径 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:136) |
| 用户端 | `uc_finished_ad_records` | 查看推送记录 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:137) |
| 用户端 | `uc_derivation` | 衍生视频 | 有局部校验；衍生入口与提交 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:138) |
| 用户端 | `uc_finished_interaction` | 查看互动数据 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:139) |
| 用户端 | `uc_finished_project_upload` | 上传工程文件 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:140) |
| 用户端 | `uc_finished_project_download` | 下载工程文件 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:141) |
| 用户端 | `uc_finished_project_visibility` | 修改工程文件访问权限 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:142) |
| 用户端 | `uc_finished_delete` | 删除 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:143) |
| 用户端 | `uc_finished_asset_data` | 查看素材数据 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:144) |
| 用户端 | `uc_finished_reference_data` | 查看引用数据 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:145) |
| 用户端 | `uc_finished_new_version` | 上传新版 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:146) |
| 用户端 | `uc_material_edit` | 修改基础信息 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:153) |
| 用户端 | `uc_material_status` | 修改状态 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:154) |
| 用户端 | `uc_material_download` | 下载原片 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:155) |
| 用户端 | `uc_material_logs` | 查看操作记录 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:156) |
| 用户端 | `uc_material_delete` | 删除 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:157) |
| 用户端 | `uc_material_reference_data` | 查看引用数据 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:158) |
| 用户端 | `uc_material_new_version` | 上传新版 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:159) |
| 用户端 | `uc_third_party_edit` | 修改基础信息 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:166) |
| 用户端 | `uc_third_party_status` | 修改状态 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:167) |
| 用户端 | `uc_third_party_download` | 下载原片 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:168) |
| 用户端 | `uc_third_party_logs` | 查看操作记录 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:169) |
| 用户端 | `uc_third_party_delete` | 删除 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:170) |
| 用户端 | `uc_third_party_reference_data` | 查看引用数据 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:171) |
| 用户端 | `uc_third_party_new_version` | 上传新版 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:172) |
| 用户端 | `uc_script_edit` | 修改基础信息 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:179) |
| 用户端 | `uc_script_status` | 修改状态 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:180) |
| 用户端 | `uc_script_logs` | 查看操作记录 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:181) |
| 用户端 | `uc_script_delete` | 删除 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:182) |
| 用户端 | `uc_image_edit` | 修改基础信息 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:189) |
| 用户端 | `uc_image_download` | 下载无水印图片 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:190) |
| 用户端 | `uc_image_delete` | 删除 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:191) |
| 用户端 | `uc_audio_edit` | 修改基础信息 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:198) |
| 用户端 | `uc_audio_download` | 下载 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:199) |
| 用户端 | `uc_audio_delete` | 删除 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:200) |
| 用户端 | `uc_data_analysis` | 数据分析 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:205) |
| 管理端 | `ab_resource_view` | 资源库（不包含删除类） | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:213) |
| 管理端 | `ab_video_status_manage` | 视频状态 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:214) |
| 管理端 | `ab_tag_manage` | 公共标签 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:215) |
| 管理端 | `ab_category_manage` | 分类管理 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:216) |
| 管理端 | `ab_script_template_manage` | 脚本模板 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:217) |
| 管理端 | `ab_dept_view` | 组织部门架构 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:224) |
| 管理端 | `ab_member_export` | 导出人员表 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:228) |
| 管理端 | `ab_role_view` | 角色菜单权限配置 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:230) |
| 管理端 | `ab_audit_export` | 导出 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:234) |
| 管理端 | `ab_watermark_manage` | 水印 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:236) |
| 管理端 | `ab_system_setting_manage` | 系统设置 | 部分：账户可见配置保存有校验 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:237) |
| 管理端 | `ab_auto_tag_manage` | 系统自动化标签 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:238) |
| 管理端 | `ab_ad_group_manage` | 广告主管理 | 有局部校验；授权、绑定、同步操作 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:239) |
| 管理端 | `ab_login_log_view` | 登录记录 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:240) |
| 管理端 | `ab_credit_manage` | 积分管理 | 未见业务接入 | [定义](D:/01工作/中科/AIGC短剧（电商）平台/mengchang3-phase1-main/src/components/AdminSystemManagementView.tsx:243) |

其中5个叶子项存在局部执行检查，其余62个未见对应业务约束。系统设置权限也仅在部分保存路径消费；普通管理员身份绕过见AUTH-05。父节点只读权限丢失和已有操作缺项见AUTH-13，未作为额外叶子项计数。

