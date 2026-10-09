# 一期千川推送投放接口核查表

核查日期：2026-09-28（本轮复核Q02/Q04/Q05/Q24，新增Q28至Q32；其他条目保留其原核查边界）。

状态：持续核查中的研发依据，不是全部字段已经验证的最终接口契约。已阅读公开文档，尚未取得真实账户联调证据。仅修改一期原型；原版与参考手册保持不变。

## 证据与范围

- 用户目标和确认规则见 `ad-account-push-design-clarifications.md` 的 AP-039 至 AP-054；AP-048 至 AP-052 明确账户、接入、组合及旧素材保护，AP-053/AP-054 明确内容驳回返回资源库及同计划失败策略。这些规则不代表真实接口联调已闭合。
- 千川文档决定可读、可写字段及约束；云视频管家手册和现有页面仅作业务与交互参考。
- AP-045 已重新确认保留商品全域、商品乘方、直播全域、直播乘方；直播仅向已有计划追加，不新增直播计划或直播管理模块。四目标均需分别核实接口适用性，功能范围确认不替代接入验证。
- AP-046 确定暂不投放使用仅推送，一期不提供创建后暂不启用选项；新建商品计划路径明确请求开启，但不将创建成功等同于已经投放。
- 本平台任务、权限、模板及命名规则属于本地流程；千川广告对象的数据不得由本地标签或模拟计时推断。
- 必填包括无条件必填与条件必填；允许不填不等于任何场景都允许传入。对不适用字段从请求中省略，不传空值或陈旧配置碰运气。
- 下文请求路径省略域名时以文档所列域名为准；上传接口与计划接口域名不同，不机械拼接到同一 API 基地址。
- 用户已要求先核实接口再制定功能，不将技术可行性问题交给不了解千川业务的用户判断。证据充分的技术处理由助手给出结论；只有真实业务取舍继续逐项确认，用户同意不补足缺失的接口证据。

### 能力判定口径

| 判定 | 设计要求 |
| --- | --- |
| 官方接口明确提供 | 记录实际接口、字段和对象范围，不把文档存在等同当前应用已取得权限或已经联调成功 |
| 本平台流程逻辑 | 明确由本平台维护，例如任务状态、勾选范围和不发送删除请求的保护；不得冒称千川原生开关或远端状态 |
| 条件支持 | 写清账户类型、权限、白名单、素材和营销目标等前提，条件不满足时不可执行 |
| 尚未证实 | 不构造可提交字段或承诺完成；继续核查，或保留明确受限状态，不能用模拟成功补齐 |

## 官方来源

| 编号 | 文档 | 本轮证据用途 |
| --- | --- | --- |
| Q01 | [获取千川投放计划列表](https://open.oceanengine.com/labels/12/docs/1771195810853899?origin=left_nav) | 四目标过滤、列表状态、指标、时间与分页约束 |
| Q02 | [获取全域&乘方投放计划详情](https://open.oceanengine.com/labels/12/docs/1804362305657868?origin=left_nav) | 已有计划的商品、抖音号、素材关联、操作与投放状态 |
| Q03 | [新建全域投放计划](https://open.oceanengine.com/labels/12/docs/1804360384937988?origin=left_nav) | 商品全域创建参数与条件限制 |
| Q04 | [新建乘方商品投放计划](https://open.oceanengine.com/labels/12/docs/1872485038037385?origin=left_nav) | 商品乘方创建参数与授权条件 |
| Q05 | [添加乘方&全域投放计划下素材](https://open.oceanengine.com/labels/12/docs/1835232814536707?origin=left_nav) | 专用追加接口，不用全量编辑接口模拟追加 |
| Q06 | [删除全域投放计划下素材](https://open.oceanengine.com/labels/12/docs/1804363891396633?origin=left_nav) | 可移除范围、素材 ID、共用素材影响 |
| Q07 | [更改乘方&全域投放计划状态](https://open.oceanengine.com/labels/12/docs/1804364027501580?origin=left_nav) | ENABLE / DISABLE 与操作数量上限 |
| Q08 | [获取全域投放计划下素材](https://open.oceanengine.com/labels/12/docs/1804363488115850?origin=left_nav) | 审核、可投状态及有消耗数据范围限制 |
| Q09 | [上传视频素材](https://open.oceanengine.com/labels/12/docs/1697466676592651?origin=left_nav) | 文件上传、MD5、URL 限制、入库延迟、ID 返回 |
| Q10 | [异步上传视频文件](https://open.oceanengine.com/labels/12/docs/1849924274825865?origin=left_nav) | 连山云 URL 前提、异步任务 ID；结果查询见 Q18 |
| Q11 | [获取千川素材库视频](https://open.oceanengine.com/labels/12/docs/1739309912219663?origin=left_nav) | 入库查询、ID 匹配、预览权限与过期时间 |
| Q12 | [全域&乘方 商家可选商品列表](https://open.oceanengine.com/labels/12/docs/1825216221095947?origin=left_nav) | 商品选择、不可投原因、乘方筛选条件 |
| Q13 | [获取乘方&全域投放抖音号列表](https://open.oceanengine.com/labels/12/docs/1771196800070656?origin=left_nav) | 创编与授权查询场景、抖音号可用条件 |
| Q14 | [乘方商品-抖音号选择列表](https://open.oceanengine.com/labels/12/docs/1870942264507403?origin=left_nav) | 商品乘方按商品查询可用抖音号、渠道关联 |
| Q15 | [编辑乘方商品投放计划](https://open.oceanengine.com/labels/12/docs/1872485645689866?origin=left_nav) | 明确全量更新，不能直接用新视频数组覆盖旧配置 |
| Q16 | [获取千川投放计划审核建议](https://open.oceanengine.com/labels/12/docs/1832628101966183?origin=left_nav) | 补充审核建议与失败原因；无审核通过状态，不能由空结果推断通过 |
| Q17 | [上传图片素材](https://open.oceanengine.com/labels/12/docs/1697466652499972?origin=left_nav) | 封面图片 ID、格式限制及入库延迟 |
| Q18 | [查询视频上传任务结果](https://open.oceanengine.com/labels/12/docs/1849924610648267?origin=left_nav) | PROCESS / SUCCESS / FAILED、错误信息及视频标识 |
| Q19 | [获取千川账户类型](https://open.oceanengine.com/labels/12/docs/1754620816918532?origin=left_nav) | 商家、商家达人、普通达人、机构分支 |
| Q20 | [获取客户公开信息](https://open.oceanengine.com/labels/12/docs/1697468127552590?origin=left_nav) | 名称及主体信息，不包含账户状态 |
| Q21 | [获取客户信息](https://open.oceanengine.com/labels/12/docs/1697468139129870?origin=left_nav) | 账户状态与原因，权限及枚举仍需联调 |
| Q22 | [获取已授权账户](https://open.oceanengine.com/labels/12/docs/1697467748096067?origin=left_nav) | 授权主体类型、有效性与授权范围 |
| Q23 | [乘方&全域-达人/机构获取可选商品列表](https://open.oceanengine.com/labels/12/docs/1825216033296576?origin=left_nav) | 账户及抖音号范围内的可选商品、不可投原因、渠道与游标分页 |
| Q24 | [全域授权初始化](https://open.oceanengine.com/labels/12/docs/1840937462771724) | 特定达人/机构商品权限原因的初始化；单账户10分钟限一次 |
| Q25 | [账户关系（必读）](https://open.oceanengine.com/labels/12/docs/1697479282314255?origin=left_nav) | 登录账号、店铺、代理商与实际投放账户的层级关系 |
| Q26 | [获取店铺账户关联的投放账户列表](https://open.oceanengine.com/labels/12/docs/1697467801357320?origin=left_nav) | 店铺授权主体展开到千川PC投放账户 |
| Q27 | [获取代理商账户关联的投放账户列表](https://open.oceanengine.com/labels/12/docs/1697467832592392?origin=left_nav) | 代理商授权主体展开、ID含义及两种分页方式 |
| Q28 | [获取白名单能力](https://open.oceanengine.com/labels/12/docs/1763675121890315?origin=left_nav) | 账户、能力key及逐项结果；失败或缺项不等于支持 |
| Q29 | [智能优惠券白名单](https://open.oceanengine.com/labels/12/docs/1771275948928071?origin=left_nav) | 标准投放场景、账户及商品/抖音号维度，不能泛化为全部全域/乘方支持 |
| Q30 | [获取千川操作日志](https://open.oceanengine.com/labels/12/docs/1832813828161028?origin=left_nav) | 核查辅助证据，不具备按原写入request_id反查的保证 |
| Q31 | [枚举值](https://open.oceanengine.com/labels/12/docs/1697459871220739?origin=left_nav) | 投放状态、视频与封面比例/尺寸/格式/大小限制 |
| Q32 | [获取千川素材库图片](https://open.oceanengine.com/labels/12/docs/1739304248623182?origin=left_nav) | 图片ID/素材ID/MD5互斥筛选、分页、分钟级入库延迟、预览URL权限与有效期 |

## 查询与展示

### 账户与授权

| 来源 | 接口与请求 | 可展示字段与约束 |
| --- | --- | --- |
| Q22 | `GET https://api.oceanengine.com/open_api/oauth2/advertiser/get/`；文档要求 Access-Token 请求头及 `access_token` 参数 | 返回 `account_id/account_name/account_type/account_role/is_valid` 等授权主体信息。授权主体可能是店铺、机构或代理商，不能把任意 `account_id` 当成可投放的 `advertiser_id`；店铺与代理商关系展开见 Q25 至 Q27，其他主体路径不据此猜测 |
| Q26 | `GET https://api.oceanengine.com/open_api/v1.0/qianchuan/shop/advertiser/list/`；`shop_id` 必填 | `shop_id` 来自 `PLATFORM_ROLE_SHOP_ACCOUNT` 主体；返回 `list`、`adv_id_list[].adv_id/adv_name/extra_permission` 及 `page_info`。`permission` 可选，不传默认查询有千川PC权限的账户；不额外扩展随心推 |
| Q27 | `GET https://ad.oceanengine.com/open_api/2/agent/advertiser/select/`；`advertiser_id` 必填 | 这里的请求 `advertiser_id` 指代理商 ID，不是最终投放账户 ID；返回 `list` 为千川投放账户 ID，`account_source=QIANCHUAN`。名称、账户状态和业务类型另查，不能虚构到此响应 |
| Q20 | `GET https://ad.oceanengine.com/open_api/2/advertiser/public_info/`；`advertiser_ids` 必填，1至100个 | `id/name/company/first_industry_name/second_industry_name`；未授权账户会报错。该响应不含账户状态；文档响应表 `date` 拼写与实际响应层级仍须校验 |
| Q21 | `GET https://ad.oceanengine.com/open_api/2/advertiser/info/`；`advertiser_ids` 必填，`fields` 可选 | `id/name/role/status/reason/company` 等按字段白名单获取；需要千川客户管理对应权限。状态完整枚举附录尚未核实，不把授权有效等同账户可投 |
| Q19 | `GET /open_api/v1.0/qianchuan/advertiser/type/get/`；`advertiser_ids` 必填，最多20个 | `list[].advertiser_id/ecp_type/shop_business_type`；`ecp_type` 为 SHOP、SHOP_STAR、COMMON_STAR、AGENT，分别为商家、商家达人、普通达人、机构；此处 AGENT 含义不可套用其他接口的同名枚举 |

- Q22 重新授权会替换原授权范围，正式接入不能只增加新勾选账户而丢失仍需保留的账户。
- Token 由服务端安全保存，不展示在任务详情、链接和日志中。
- 商家、达人和机构的可选商品来源不同。AP-048 已纳入参考手册能证实的达人与机构投放能力；代运营员工操作已授权的商家账户不等于使用达人或机构身份投放。此业务范围不自动决定全部账户枚举的支持情况，仍需核对实际商品归属与授权关系。
- Q25：OAuth 基于登录账号展开，店铺和代理商是其下的授权资产；再按对应关系接口取得实际投放账户。一个授权主体可关联多个投放账户，不能以“每次只接入一个账户”的本地操作规则推导远端授权必然只影响一个账户。
- Q25 支持店铺管理员及子账户授权；代理商需直接登录其代理商账号授权，不支持经一站式登录商家后台后授权。参考手册的历史授权说明不覆盖当前官方规则，也不采用手册示例中的账号密码转交操作。
- Q26：`page` 默认1，`page_size` 默认10、范围1至100。Q27：少于10000条可用 `page/page_size`，默认1/100，`page_size` 最大1000；达到10000条使用 `cursor/count`，首次不传游标，后续读取 `cursor_page_info.cursor/has_more`。不能混用分页参数或只拿第一页冒充全部账户。
- Q27 支持代理商账户，且需千川代理商管理对应权限；接口存在不代表当前应用或全部授权主体已拥有权限。授权关系、账户业务类型及实际操作权限分别核查，机构投放账户不等于代理商授权主体。
- AP-049 已取代 AP-023 的单账户限制：官方主体授权后，由管理员多选本次要接入的实际广告账户，默认不勾选、不自动全量接入。只在当前授权范围内选择，不放宽本平台可见范围，不以本地勾选覆盖远端 OAuth 范围，也不因未勾选取消既有接入。
- AP-050 已确认将千川账户的“取消授权”明确为“解除接入”，只影响所选账户在本平台的可用性，不撤销官方授权、不影响其他账户、不停止千川已有投放，保留历史并沿用进行中任务拦截。当前代码仍只有本地失效标记，不能对共享授权令牌执行整次撤销来模拟解除某一个账户。
- 接入状态与远端授权有效性需分别表达；同步官方授权有效不代表恢复管理员已解除的接入。重新接入沿用原账户及本地分组、配置、历史，重新核对实际授权和操作权限，不用历史状态跳过校验，也不重复生成账户。

### 计划列表和详情

来源 Q01：`GET /open_api/v1.0/qianchuan/uni_promotion/list/`。

| 页面信息或条件 | 官方字段 | 要求及差异 |
| --- | --- | --- |
| 广告账户 | 请求 `advertiser_id` | 必填；只能使用已授权且本平台用户有操作权限的实际投放账户，授权与账户信息见 Q19 至 Q22，店铺/代理商展开见 Q25 至 Q27；不可用授权主体 ID 替代 |
| 商品全域 | `marketing_goal=VIDEO_PROM_GOODS`，`adlab_scene=UNI_PROJECT` | 两字段共同区分，不与商品乘方共用未过滤结果 |
| 商品乘方 | `marketing_goal=VIDEO_PROM_GOODS`，`adlab_scene=OVERALL_PROJECT` | 同上 |
| 直播全域 | `marketing_goal=LIVE_PROM_GOODS`，`adlab_scene=UNI_PROJECT` | 只用于已有计划选择 |
| 直播乘方 | `marketing_goal=LIVE_PROM_GOODS`，`adlab_scene=OVERALL_PROJECT` | 只用于已有计划选择 |
| 数据时间 | 请求 `start_time`、`end_time` | 必填，近180天内，跨度不超过180天；不是计划创建时间筛选 |
| 查询指标 | 请求 `fields` | 必填；仅请求当前页面已证实的指标 |
| 搜索、状态、创建日期 | `filtering.search_keyword/search_keyword_type/status/create_start_date/create_end_date` | 文档限定商品目标支持，不能给直播请求照搬这些参数 |
| 出价方式 | `filtering.smart_bid_type` | 文档默认控成本；要展示两类时不能无意依赖该默认值漏掉放量计划，聚合或查询方式需验证 |
| 计划 ID、名称 | `data.ad_list[].ad_info.id/name` | ID 不得使用本地随机字符串冒称真实远端返回 |
| 实际投放状态 | `ad_info.status` | 保留审核中、余额不足、预算不足、不在投放时间、暂停等差异，不能压成只有投放中/已暂停 |
| 操作状态 | `ad_info.opt_status` | 与投放状态不同；完整枚举映射需继续核对官方附录 |
| 预算、ROI 目标、创建时间 | `ad_info.budget/roi2_goal/create_time` | 不用本地提交值冒充最新远端值，区分提交快照与同步结果 |
| 整体消耗 | `stats_info.stat_cost` | Q01 单位为千分之一分；展示元需除以100000，不能沿用其他接口的单位 |
| 整体支付 ROI | `stats_info.total_prepay_and_pay_order_roi2` | 直接使用官方指标，不擅自用另一个成交金额除以消耗替代 |
| 整体成交金额 | `stats_info.total_pay_order_gmv_include_coupon_for_roi2` | 与用户实际支付金额 `total_pay_order_gmv_for_roi2` 不混用 |
| 分页 | `page/page_size`，响应 `page_info` | Q01 支持10/20/50/100；平台分页控件的展示与服务端分页范围需适配 |

来源 Q02：`GET /open_api/v1.0/qianchuan/uni_promotion/ad/detail/`，`advertiser_id`、`ad_id` 必填。

- 商品关系来自 `product_infos`；商品创意关联来自 `multi_product_creative_list[].product_id/aweme_uid/video_material`。
- 直播视频关联来自 `programmatic_creative_media_list.video_material`；多号信息另有 `aweme_infos`。
- 追加选择后需保存具体账户、计划、商品与抖音号关联，不能把一个视频的计划级归属误当作所有商品都已关联。
- AP-051：多个有效商品、抖音号组合由运营勾选，不默认全选；唯一有效组合自动带出并展示。候选来自所选计划已有的实际关联，不将账户级对象任意组合，不借追加视频增加新商品或新抖音号；关联缺失或不明时阻止该目标提交。
- Q02 可核对 `video_id` 关联，但本轮所读详情未提供逐素材审核状态；关联存在不等于审核通过。
- 2026-09-24 再次核对 Q02：商品创意中的视频字段为 `video_id`，不是删除接口的 `material_id`。需按同一账户通过 Q11 等已核实来源建立映射，并以素材 ID 汇总关联；不能只比较视频 ID 就断言没有共用，也不能将 `product_infos` 与 `aweme_infos` 任意配对推断绑定关系。
- Q02 的 `adlab_scene` 描述为 number，Q01 列表则为字符串枚举，不能未经验证共享解析逻辑；四入口优先按 Q01 的明确枚举过滤。

### 商品与抖音号

| 页面信息 | 官方字段或来源 | 必填与适用约束 |
| --- | --- | --- |
| 商家商品选择 | Q12 `/qianchuan/uni_promotion/product/get/` | `advertiser_id`、`filtering` 必填；有号商家 `aweme_id` 条件必填；乘方场景传 `is_overall_marketing` |
| 商品名称、主图、分类、库存 | Q12 `product_list[].name/img/category_name/stock_num` | 不在该响应中出现的价格、店铺等字段不可凭模拟对象补齐 |
| 不可投原因 | Q12 `gray_reason` | 有原因的商品显示不可选及原因，不用任意预设商品代替授权范围查询 |
| 渠道商品 | Q12 `channel_id/channel_type` | 后续写入字段需按目标创建接口映射，不把普通商品 ID 当作渠道 ID |
| 通用全域创编抖音号 | Q13 `/qianchuan/uni_aweme/authorized/get/` | `advertiser_id` 必填，`filtering.scene=CREATE`；APPLY 是授权申请页面，不是创编可用列表 |
| 抖音号名称、头像、ID | Q13 `aweme_id_list[].aweme_name/aweme_avatar/aweme_id/aweme_show_id` | 内部抖音号 ID 与用户看到的抖音号不同 |
| 抖音号不可用原因 | Q13 `is_product_uni_prom_disabled/product_disable_reasons` 或直播对应字段 | 创编不可用判断有具体适用场景，不能直接用于已有计划追加后误判“已有计划”本身不可用 |
| 商品乘方按商品选抖音号 | Q14 `/qianchuan/overall_aweme/list/` | `advertiser_id`、`page_params.page/page_size` 必填；`filter.product_id` 指定当前商品 |
| 商品乘方授权与限制 | Q14 `bind_aweme_user_infos` 下的 `aweme_user_info`、`product_uni_prom_info`、`multi_aweme_uni_prom_auth_status` | 区分生效授权、自动授权条件、无授权；不由存在列表结果推断可投，也不悄悄扩展自动授权范围 |
| 达人/机构商品选择 | Q23 `/qianchuan/uni_promotion/product/aweme/get/` | `advertiser_id`、`aweme_id`、`filtering` 必填；`platform` 可选、默认 QIANCHUAN，本期不扩展 ECP_AWEME 随心推 |
| 达人/机构商品信息 | Q23 `product_list[].id/name/img/tag/category_name/sell_num/gray_reason`、`square_image_list[].url` | 展示官方可获取字段；`gray_reason` 是不可投放原因数组，不以查到商品或有销量代替可投判断 |
| 达人/机构商品渠道 | Q23 `channel_id/channel_type` | SHOP_SELL 商家自卖、STAR_SELL 达人自播；渠道信息随所选商品保留，不等同于账户类型 |

Q12 商家接口不能自动覆盖达人/机构场景。Q23 已证实存在专用商品查询，但不能据此认定四种账户类型在所有目标下都完成可创建性验证。店铺选择器数据与必需性仍须追踪，不保留无接口映射的全局模拟店铺列表。

- Q23：`filtering.tab` 可选 ALL（默认）/BREAKTHROUGH_PRODUCT/NEW_PRODUCT；商品名称模糊搜索 `product_name`，`product_ids` 为1至50个。`create_roi2_limit_product` 只在 ALL/BREAKTHROUGH_PRODUCT 下支持，已投放商品超过3000时可能不准确，不将筛选结果当作“绝对未投放”校验。
- Q23 使用 `cursor` 及响应 `page_info.cursor/has_more`，未给出总数或页大小参数。现有统一分页组件需适配游标，不伪造总条数或任意跳页能力。
- Q23 返回表未给出价格、店铺名称或库存字段。不能因渠道字段描述提及价格，便认为有已确认的价格字段；也不将 Q12 的库存字段复制为达人/机构必有字段。
- Q24：只有遇到文档指定的“当前账户无使用该抖音号投放所选商品的全域投放权限”原因时，官方提供 `POST https://api.oceanengine.com/open_api/v1.0/qianchuan/uni_promotion/auth/init/` 初始化途径。请求体 `advertiser_id` 必填，Access-Token 与 application/json 请求头必填，每个投放账户10分钟最多调用一次。
- Q24 返回的是初始化请求结果，不是所有商品已可投的证明。初始化后仍需重查 Q23；失败、权限不足、限频或仍有不可投原因时不得将商品强制变为可选。是否触发和由谁触发仍需结合管理端授权规则设计，不能擅自在用户端增加授权入口；本轮未调用该写接口。

## 上传与标识

### 同步上传

来源 Q09：`POST https://ad.oceanengine.com/open_api/2/file/video/ad/`，`multipart/form-data`。

| 参数 | 必填性 | 提供方或条件 |
| --- | --- | --- |
| `advertiser_id` | 必填 | 本次授权广告账户 |
| `upload_type` | 可选 | 默认 `UPLOAD_BY_FILE`；另有 `UPLOAD_BY_URL` |
| `video_signature`、`video_file` | 条件必填 | FILE 方式必填；签名是视频 MD5 校验值，不是用户手填的创意字段 |
| `video_url`、`filename` | 条件必填 | URL 方式必填；文档限制连山内网 HTTPS 视频地址，不支持直接假设现有 CDN 地址可传 |
| `is_aigc` | 可选 | 素材是否 AIGC 生成；保留真实来源信息，不为绕过审核省略或错误声明 |

- 文件格式：mp4、mpeg、3gp、avi；文件上传文档有10秒超时限制。不能由此编造所有广告场景通用的时长、分辨率或大小范围，尚需核对实际投放规格。
- `filename` 最长255字符；重复上传同一素材不会改名，不能承诺修改本地命名即可重命名千川已有素材。
- 响应分别包含 `video_id`、`material_id`、宽高、时长、大小；同一素材重复上传可能产生不同 `video_id`，但对应同一 `material_id`。
- 投放创意使用 `video_id`，移除接口使用 `material_id`，本地成片使用资源 ID。三者不能共用一个 `assetId` 随意代替。
- 素材库存在分钟级延迟。上传成功后进入“等待素材入库”流程，再确认目标账户可查询到素材；不能按固定几秒认定可用或立即调用创建。

### 异步上传

Q10：`POST /open_api/2/file/upload_task/create/`。

- `account_id/account_type/filename/video_url` 必填；`account_type` 支持 ADVERTISER / AGENT，本期账户投放不自动扩大为代理商业务。
- URL 仅支持已购买连山云素材服务生成的 TOS 链接或连山视频点播链接，不支持其他第三方链接，最大1000M。
- 返回远端 `task_id`，按 Q18 查询结果，不把提交异步任务当作上传成功。
- 这条路径带额外服务依赖，不为复用现有 URL 输入而假设已经具备购买或开通条件。

Q18：`GET https://api.oceanengine.com/open_api/2/file/video/upload_task/list/`。

- `account_id/account_type/task_ids` 必填，任务 ID 最多100个；必须按任务所属账户查询。
- 返回上传任务状态 PROCESS / SUCCESS / FAILED，以及 `error_msg/create_time/task_id`。
- 成功的 `video_info` 含 `video_id/material_id/video_signature/size/width/height/video_url/duration`，再进入素材库可查询确认流程。
- 文档说明正常约3分钟，但受队列和上传速度影响；不能作为固定成功倒计时。超时结果不明时继续核实原任务，不盲目创建另一上传任务。

### 入库、预览与封面

Q11：`GET https://ad.oceanengine.com/open_api/v1.0/qianchuan/video/get/`。

- `advertiser_id` 必填；`filtering.video_ids/material_ids/signatures` 三选一，每组最多100个；文档说明素材获取目前仅支持10000个。
- 返回 `id` 为 `video_id`，另有 `material_id`、`filename`、`image_mode`、`create_time` 和 `is_ai_create` 等。
- 预览 URL、首帧 URL 受主体/敏感物料授权约束，且一小时过期；未授权时显示受限状态，不将不可预览解释为素材不存在。
- 响应不包含素材审核状态。上传成功、入库可查询与审核通过不是同一步。
- 首帧截图 URL 不是 `video_cover_id`；封面图片需按 Q17 上传并使用返回的图片 ID，不能用本地 URL 直接替代远端图片 ID。

Q17：`POST https://ad.oceanengine.com/open_api/2/file/image/ad/`，`multipart/form-data`。

- `advertiser_id` 必填；FILE 方式默认，`image_signature`（MD5）和 `image_file` 条件必填；URL 方式 `image_url` 条件必填，允许公网可访问图片地址，不照搬视频的连山 URL 限制。
- `filename` 可选、最多255字符，重复素材不会因此改名；`is_aigc` 可选，按素材真实来源声明。
- jpg/jpeg/png/bmp，不超过1.5M；页面素材规格表不能直接替代四目标各自创意规格校验。
- 响应 `data.id` 为图片 ID，`material_id` 是另一个标识；另有尺寸、签名等信息，URL 有效期一小时。
- 图片也存在分钟级入库延迟，不能上传后立即断言可用于创建。图片入库查询及与各体裁封面的有效关联仍需联调。

## 创建参数

### 商品全域

来源 Q03：`POST /open_api/v1.0/qianchuan/uni_aweme/ad/create/`。

| 参数 | 必填性 | 页面与提交约束 |
| --- | --- | --- |
| `advertiser_id`、`marketing_goal` | 必填 | 商品目标为 VIDEO_PROM_GOODS |
| `name` | 文档未标无条件必填 | 商品目标才支持，1至100字符、汉字计2，名称不可重复；产品可自动生成，但不得冒称接口允许任意重复名 |
| `aweme_id` | 条件必填 | 有号商家必填；无号商家不需传入，但本接口无号商家只支持商品卡体裁，不能用于当前成片视频投放 |
| `product_ids` | 商品目标必填 | 最多30个；不要把该限制推广到其他接口 |
| `product_channel_info` | 可选/依渠道场景 | 包含商品、渠道 ID 及渠道类型；实际请求按目标数据映射 |
| `delivery_setting` | 必填 | 下列字段属于该对象 |
| `delivery_setting.smart_bid_type` | 必填 | 控成本 SMART_BID_CUSTOM / 放量 SMART_BID_CONSERVATIVE |
| `delivery_setting.roi2_goal` | 条件必填/条件禁止 | 控成本必填、最多两位小数；放量不支持填入，传入会报错 |
| `delivery_setting.budget` | 必填 | 元、最多两位小数；文档本页未给出参考截图中的30/300下限及最大值，待进一步证实 |
| `delivery_setting.video_schedule_type` | 可选 | 长期 SCHEDULE_FROM_NOW / 起止 SCHEDULE_START_END |
| `delivery_setting.start_time/end_time` | 条件必填 | 指定起止时必填；YYYY-MM-DD、开始不早于当天、结束不早于开始 |
| `delivery_setting.qcpx_mode` | 可选 | OFF / ON；账户能力条件另查，不能只因有开关就承诺可用 |
| `delivery_setting.deep_external_action` | 可选 | 成交 ROI / 净成交 ROI；展示名称必须与所传枚举一致 |
| 预算建议相关四个 `estimate_*` 字段 | 条件必填 | 使用建议预算时的官方条件；尚未核对建议预算接口，不能用任意模拟数传入 |
| `multi_product_creative_list[].product_id` | 对象内必填 | 对应所选商品 |
| `multi_product_creative_list[].video_material` | 接口字段可选，本业务需要 | 当前用户要求投放成片，因此需提供视频，不把业务必需误标为接口无条件必填 |
| 视频 `image_mode/video_id/video_cover_id` | 依视频创意场景 | 素材类型、视频及封面 ID，不能混用 aweme_item_id 与素材库 video_id |
| `title_material` | 非抖音主页素材场景至少一条 | 当前成片上传属于素材库视频；无标题可能导致素材不生效 |
| `title_material[].title` | 对象内必填 | 10至110字符、汉字计2；最多30个标题，不是单纯 JS 字符串55字校验 |
| `title_material[].title_type` | 可选/体裁相关 | 当前视频自定义标题 CUSTOM；不要误传商品卡标题 |
| `hide_in_aweme` | 条件可用 | 官方/自运营且存在非主页原生视频时可设置；达人关系不支持，传了也无效 |

`daily_delivery_time` 仅直播放量场景支持，不属于当前商品创建表单。官方说明中出现“1个投放卡片”，但本轮正文未找到完整创建卡片参数；详情返回可读卡片字段不证明创建接口可写，同样列为未证实项。

### 商品乘方

来源 Q04：`POST /open_api/v1.0/qianchuan/overall_video/create/`。

- 无条件必填：`advertiser_id/name/product_ids/delivery_setting`，以及其中 `roi2_goal/budget`。
- `delivery_setting.video_schedule_type/start_time/end_time/qcpx_mode` 按文档条件处理；ROI 必填，不能将商品全域放量请求原样复用。
- `delivery_setting.overall_cost_items.star_task_material_switch` 为星选素材开关；`alliance_commision_switch` 是文档实际拼写，受白名单与有号等条件限制。
- `delivery_setting.enable_aigc_creative` 是千川 AIGC 动态创意开关，不等于上传视频的 `is_aigc` 来源声明。
- `multi_product_creative_list` 按商品与抖音号组合组织；有号商家 `aweme_uid` 条件必填；隐藏主页与标题的限制见 Q04 原文，不能用通用模板静态表单替代。
- 本页参数表未列出启停参数。请求示例又包含参数表未列出的 `smart_bid_type/marketing_goal/deep_external_action` 等，属于文档差异，需确认后再使用，不能因为示例出现就补成界面必填项。

## 追加、启用和移除

| 动作 | 官方依据 | 必须保证的边界 |
| --- | --- | --- |
| 追加已有计划 | Q05 `/qianchuan/uni_promotion/ad/material/add/` | 账户、计划必填；商品对应 `multi_product_creative_list`，直播对应 `programmatic_creative_media_list`；多号场景 `aweme_uid` 条件必填。AP-051 已确认商品场景的组合选择；逐目标请求映射与适用性仍待验证 |
| 请求开启 | Q07 `/qianchuan/uni_promotion/ad/status/update/` | `advertiser_id/ad_ids/opt_status` 必填，一次最多10计划；ENABLE 是请求启用，不等于已经投放或产生消耗 |
| 核对当前状态 | Q02 计划详情及 Q01 列表 | 区分 opt_status、status 及本地步骤；写接口失败或超时不得直接标成已开启 |
| 移除旧视频 | Q06 `/qianchuan/uni_promotion/ad/material/delete/` | 按素材 ID、最多100个；不支持智选素材；多号多商品共用素材可能同时被移除；遵守 AP-042 的新素材保护 |
| 查询旧/新素材审核与可投性 | Q08 | 有 audit_status、material_status、delivery_not_reason，但只返回查询日期内有消耗素材；不是所有新素材审核状态的完整通道 |
| 获取审核建议 | Q16 `/qianchuan/uni_promotion/ad/suggestion/` | `advertiser_id/ad_id` 必填，`filtering.material_ids/product_ids` 可选；返回 `product_id/material_id/desc/audit_platform/audit_reason` 等，不返回审核通过状态，空列表不能作为移除旧素材的依据 |

不能把“编辑乘方商品计划”的全量更新请求当作追加。也不能把请求超时当作确定失败后盲目重建：需先核对远端结果并保留已知素材/计划标识，未知结果不进入破坏性后续操作。

Q06 于2026-09-24再次直接复核：视频移除请求提供 `advertiser_id/ad_id/material_ids`，没有商品或抖音号维度的删除限定字段；官方说明多号、多商品共用时同时删除对应素材。不能声称只移除本次勾选组合的一份关联，也不能因此推断会删除其他计划或账户素材库中的视频。AP-052 的共用保护已落实到本地模拟：根据组合、完整性标记及素材 ID 的全部视频别名判断是否保留。真实关联查询、完整性判定及删除前远端复核尚未接入。

### 跨组合保护的接口链

1. Q05 的独立追加接口支持商品创意及多号场景的抖音号字段；只追加而不删除旧素材无需额外的删除权限或“保留”接口，但追加本身仍须满足账户、素材、容量等条件。
2. Q02 查询当前计划中实际返回的商品、抖音号与视频关联；Q11 按视频 ID 分批、分页查询相应 `material_id`。同一素材可能对应多个视频 ID，必须在当前账户和计划范围内按素材 ID 汇总。
3. 对已证实共用到未选组合的旧素材，不调用 Q06。查询不完整、映射缺失、只返回不可映射的抖音主页 ID、无法核实可删来源或影响范围时，也不调用 Q06，不把缺失结果当作没有共用。
4. 保留原因只使用真实已核实内容；范围未知时明确为未知，不编造共用商品或抖音号列表。追加回执、审核和可投反馈、保护性跳过分别记录，跳过不等于移除成功。
5. Q06 无版本条件或关联级删除参数，查询与删除之间的远端并发变化不能由接口原子保护。实际移除还必须满足 AP-042，并核查完整范围及并发变化；当前不承诺所有新素材审核和自动替换场景均已闭合。

Q08 本轮复核补充：

- 素材 ID 位于 `ad_material_infos[].material_info.video_material.material_id`；返回 `audit_status` 与 `material_status` 是不同结论。
- `material_status` 包含 DELIVERY_OK（投放中）、DELETED、EXCLUDE、DELIVERY_NOT；不能将“查询到”解释为投放中。
- `material_select_type` 为 CUSTOM（自选）或 AUTO（智能优选）；删除只允许已确认自选来源，不把字段缺失当作自选。
- `stats_info.stat_cost_for_roi2` 单位为元，与 Q01 `stat_cost` 的单位不同；整体支付 ROI 使用 `total_prepay_and_pay_order_roi2`，不由旧原型的 `revenue / cost` 替代。
- 原型“卡审”尚未映射到官方状态或时间条件，不能把审核拒绝直接解释为卡审。低数据移除的统计窗口、字段及空数据处理也尚未完成契约核验；新任务已禁用这些选项，历史配置也不能绕过提交校验；历史任务仍执行保守的旧素材保护。

## 当前原型差异

| 文件/位置 | 已确认差异 | 后续处理要求 |
| --- | --- | --- |
| `AdPushWorkspace.tsx` PlanPicker | 已实现四目标、重复禁选及商品组合选择；多组合默认不选，唯一组合自动带出，选择和执行前均校验 | 真实 Q01/Q02 请求、直播筛选约束及服务端分页仍未接入；不以独立商品/抖音号列表构造任意组合 |
| `adPush.ts` AdPlan / AdCatalog | 样例计划、素材和任务快照保存组合；完整性未知的历史数据不会自动补齐，旧素材按保护规则保留 | `associationCoverage` 是本平台对查询完整性的判断，不是千川字段；真实分页、映射和状态刷新仍需实现 |
| `adPush.ts` AdAccount / adCatalog | 样例区分商家与达人/机构商品来源，保留商品可投抖音号、渠道和置灰原因；管理端手动同步仅补全已知示例对象缺失元数据，不重建计划 | 真实 Q12/Q23 响应适配及账户能力查询未接入；未知历史关联不猜测，不以样例代替权限证明 |
| `AdAuthorizationDialog.tsx` | 已实现默认不选的多账户接入、重复接入禁选、实际账户和主体分开展示；计时器仅生成本地演示回执 | Q25 至 Q27 的真实授权关系展开、OAuth 和账户能力校验仍未接入；不得冒称真实授权成功 |
| `adPush.ts` revokeAdAccounts / 管理端解除接入 | 千川已区分本地接入与远端授权状态；解除保留历史、配置和计划，同步不自动恢复，重接入按原账户更新 | 生产侧须原子阻止新任务与解除接入并发；不调用整次远端撤销，也不将其当作暂停广告 |
| `adPushConfig.ts` validateWorkbench | 标题10至110、汉字计2、最多30条；商品全域名称含后缀最多100字符且账户内不重名；日期和小数精度校验已统一 | Q04 名称长度未明确，不擅套Q03限制；预算30/300等未证实截图限制已移除，实际接口错误仍需处理 |
| `AdPushDialogs.tsx` ParameterFields | 已移除旧营销场景、新客、托管等参数入口；模板与直接新建使用同一目标配置，旧模板必须补全标题等参数 | 兼容存储中的旧 params 不直接透传；必须按 Q03/Q04 请求层级构建白名单参数 |
| `adPush.ts` advanceAdRecords / recheckAdRecords | 入库、创建/追加、请求开启、审核、实际投放分开展示；详情可显式选择模拟反馈并核查，查询失败保留已确认结果 | 全部回执仍为模拟；审核通过不产生 DELIVERY_OK，素材驳回不推断整条计划状态；真实查询与订阅仍需接入 |
| `adPush.ts` retryAdRecords | 保留成功阶段及远端标识；内容驳回引导资源库重发，资质驳回先处理再核查，授权失效先恢复，未知写入禁止盲重试 | 同计划失败视频补传成功后追加原计划，不重复创建或重新开启；生产幂等、并发锁和未知结果恢复仍需服务端实现 |
| `adPush.ts` assetId / remoteVideoId / coverId | 已分开视频、素材和封面标识，并在详情展示 | 本轮新增标识仍是显式原型样例，不是实际千川返回；本地任务 ID 不替代远端 task_id/request_id |
| `AdPushWorkspace.tsx` 推送方式与确认 | 三种操作保留；单/多创意模板和直接新建统一显示逐计划预算、生成名称、计划数和汇总；模板变更或名称被占用要求重新确认 | 确认快照与实际提交一致；本地分配规则不透传千川；直播仍仅追加 |
| `adPush.ts` adPlanUnits / strategy | 预览与执行共用计划划分，普通视频与衍生按相同规则；全部成功/跳过失败仅对同计划生效 | 同计划无成功视频不创建；其他账户或计划独立推进；调度器需在服务端保证原子性和幂等 |
| `AdAccountPush.tsx` / `OperationRecordsView.tsx` | 复用任务详情、状态核查、失败处理和返回资源库；取消明确仅停止未完成步骤；导出包含审核、开启、投放及核查信息 | 取消本地任务不撤销已上传素材、不删除计划、不暂停远端投放；不得将本地任务ID当成远端请求ID |
| `adPush.ts` 旧素材移除 | 已检查新素材的账户、计划、素材 ID、审核、可投反馈及所选组合；共用、未知范围、未知来源或缺少映射时保留，并展示原因 | 本地模拟覆盖多个视频 ID 指向同一素材、部分保留；真实 Q02/Q11/Q08/Q06 调度及远端并发风险仍待闭合，低数据/卡审依据未核实 |

## 2026-09-24待闭合清单

此节保留上轮审计记录。2026-09-28的原型恢复路径、保守降级及仍需正式联调的项目见文末；不将已经新增的交互继续当作缺失，也不把原型测试当作真实接入验收。

1. 新素材可靠审核/可投反馈。Q11 关联的 `status.material.qianchuan.realtime` 元数据链接实际打开巨量广告订阅总文档，本轮未找到千川该消息的完整结构；不把巨量广告消息枚举挪作千川使用。
2. 新建计划后的操作状态同步与启用请求闭环。AP-046 已排除暂停创建路径，因此无需以实现暂停创建作为一期前提；仍需读取千川反馈，不把创建成功、启用请求成功与实际可投状态合并。原子性暂停创建未证实，也不作产品承诺。
3. 白名单与达人/机构商品投放关系。非接口必需的合成店铺选择器已从创建路径移除；商品、抖音号及来源仍保留。优惠券、佣金优化在账户能力未确认时禁用，主页可见性默认为不传，仅官方/自运营关系允许配置。Q23/Q24、Q25至Q27 的公开文档不替代真实授权与联调。
4. Q03/Q04 已明确的标题、日期、金额精度约束已落实；Q04未明确的名称长度、预算边界等仍需接口反馈验证，不把截图约束泛化。
5. AP-051/AP-052 的本地组合选择、追加范围、旧素材保护与结果展示已实施；真实组合查询、ID映射、完整影响范围判断及请求/结果适配仍需实施和验证，远端并发变化尚需处理。保留既有重复视频禁选，不静默放宽范围。各目标的素材数量上限和素材类型限制仍需验证。
6. 正式应用的权限申请、账户联调和错误码验证。未完成前只能交付有证据且明确标记未验证项的设计，不能标记生产接入完成。
7. 低数据/卡审移除和推广卡片写入契约仍未证实，入口禁用且阻止提交历史配置，不伪装为可用。旧模板入口清理及同计划搭建策略已在本地实施，不表示生产请求适配完成。
8. 上传前媒体格式、体积、时长校验，转码与封面生成/上传，上传回执到素材入库的轮询及超时处理仍需后端按Q09/Q10/Q11/Q17/Q18契约实现。原型中的视频、素材、封面ID均为演示值，不是生产媒体链路验收证明。

## 本轮字段落地口径

- 预算与ROI属于 `delivery_setting`，标题属于对应商品视频创意的 `title_material`，不是旧模板 `params` 的直接序列化。
- `profile=默认` 不提交 `hide_in_aweme`；具体可见性选项仅在支持的抖音号关系下映射，不把不适用字段传空值。
- 商品乘方的星选素材、达人佣金、动态创意分别映射Q04已列出的开关；白名单未确认不能启用。优惠券依 `qcpx_mode` 的账户能力确认。
- 原型本地字段包括 `planGroupId`、搭建策略、命名词包、分配规则、模板、执行日志和模拟反馈场景，不能透传千川。
- 已新增计划回执前 `planId` 为空；确认页面展示的计划名称在提交时冻结，模板配置或同账户名称占用变化时要求重新确认。
- 操作记录的“推送成功”是本平台任务步骤完成，并不等于审核通过或实际开始消耗，详情必须保留独立状态。

## 验证清单

- 字段存在、必填/条件必填/禁止传入、枚举、单位、ID 与层级，分别有契约测试。
- 未适用字段不写入请求；本地任务、模板、分配规则不直接透传。
- 分账户上传、等待入库、封面关联、创建或追加、请求启用及结果读取能追踪各步骤。
- 同批某目标失败不阻塞成功目标；重试不重复成功步骤。
- 新视频未确认可用、容量不足、查询失败或结果不明时不移除旧素材。
- 覆盖授权失效、无权访问、关联对象过期、分页空数据、素材库延迟、审核拒绝、余额或预算不足、未到投放时间、启用失败和部分失败。
- 原型测试、接口契约测试与真实账户联调分开记录结果，不互相替代。

## 2026-09-28异常闭环补全

### 推送页商品权限修复

- 用户明确选择放在推送页面，有投放权限的运营可以操作，不限定管理员。对应AP-055。
- Q24：`POST /open_api/v1.0/qianchuan/uni_promotion/auth/init/`，Header `Access-Token` 与 `Content-Type: application/json` 必填，Body仅需必填 `advertiser_id`。运营不能编辑广告账户ID冒用其他账户，令牌仅服务端持有。
- 仅COMMON_STAR/AGENT来源的商品出现文档指定原因“当前账户无使用该抖音号投放所选商品的全域投放权限”时显示修复入口；其他不可投原因不套用该接口。
- 校验投放权限、账户可见、已接入及授权有效；点击前后都复核。一次提交后该广告账户10分钟内不再提交，超时和失败也保守计入该窗口。
- `code/message/data/request_id` 是请求回执，不含“商品已可投”结论。成功后仍保留商品置灰，运营点击“重新查询商品”，后端重跑原账户、原抖音号及目标下的Q23查询。只更新确实查询到的对象，不按接口成功直接清空全部置灰原因。
- 请求未知可以查商品，不能立刻重发初始化；商品仍不可投或查询失败分别展示，保留原原因并引导联系管理员。生产需要保存真实错误信息与request_id，原型不编造错误码。

### 未知写入的核查与继续

| 原步骤 | 可使用的官方依据 | 唯一匹配后 | 查询空数据/多候选/失败 |
| --- | --- | --- | --- |
| 视频上传 | 原上传回执，或已有task_id时Q18；Q11核对当前账户的视频与素材标识 | 复用原video_id/material_id，继续入库及封面 | 保持待确认；没有task_id不能擅自调用异步结果接口；不得按同名文件认定同一视频 |
| 封面上传 | 原上传回执及Q32，当前账户下按图片ID或MD5单独筛选并核对原文件 | 复用原图片ID，不重传视频；确认图片入库后继续 | 保持待确认；不以素材ID替代图片ID；多个图片ID或不完整结果不猜测匹配 |
| 新建计划 | Q01取得候选；Q02核对账户、ad_id、name、create_time、目标、商品/抖音号、预算及视频集合；Q30辅助排查 | 同一计划组所有分配记录关联同一个ad_id，再继续请求开启 | 不能仅凭名称/时间猜测，不允许运营手填计划ID或勾选“强制认为失败” |
| 追加素材 | Q02目标计划详情中的完整商品/抖音号/video_id集合；原追加回执 | 标记已追加，保留原计划启停状态 | 暂缺关联不能证明原请求未执行；禁止重复追加或先移除旧素材 |
| 请求开启 | Q02指定计划的opt_status及原开启回执 | ENABLE表示开启结果已确认，status另行展示 | DISABLE本身不能证明原开启请求失败，可能随后被他人暂停；无法确认时保持待确认 |

`pendingWrite/attemptId/exactMatch/recoveryEvidence`是本平台调度与核查模型，不是千川字段，也不能直接透传。生产侧写入前保存不可变请求快照、文件签名、账户、计划组和本地唯一操作键；请求日志ID存在时保存，不存在时留空。服务端按账户与计划组加锁并持久化步骤，重启后先核查，不在浏览器计时器内实现幂等。

核查只有在得到**原请求明确失败回执**后才解锁重试；查询没有结果不是明确失败。成功核查按原远端ID继续，重放核查不生成第二次写入。长期未知可继续核查、联系技术支持或取消本平台未完成步骤；取消不声称原远端请求失败、不停止实际投放，服务端仍须保留审计核查。原型的反馈选择器仅用于演示，生产页面不得提供人工伪造成功/失败结论的选择器。

同计划核查不能恢复已取消的分配记录。请求开启的成功回执仅应用一次，后续状态查询不得用历史回执覆盖千川后来暂停等变化；`enableApplied`仅是原型中回执已处理的本地标记，不是千川字段，也不是新的启用请求。

Q30：`GET /open_api/v1.0/qianchuan/tools/log_search/`；必填advertiser_id、object_type（AD/ACCOUNT），AD时object_id条件必填；operator_id、start_time、end_time、page、page_size可选，page_size为1至20。返回logs/sub_logs的object_id/name/type、create_time、content_title、content_log、operator_name/id、log_id等。响应request_id是**此次查询**的日志ID，不能当成原写入关联键。日期描述存在歧义，不擅自解释成可查询任意历史时间。

### 媒体与运行状态

- 新增文件预检失败、视频上传失败/未知、封面失败/未知、入库延迟、创建/追加/开启未知、追加容量不足的演示分支。详情显示独立视频ID、素材ID、封面ID及封面处理状态。已确认视频上传不会因封面重试而重做。
- Q31与Q09/Q17：mp4/mpeg/3gp/avi；横版16:9最多1000MB，竖版9:16最多100MB；封面jpg/jpeg/png/bmp最多1.5MB，横版1280x720至2560x1440，竖版720x1280至1440x2560。`adPushMedia.ts`校验探测后的**最终输出文件**，不从标题推断格式、体积和尺寸，也不虚构时长下限。生产须使用实际媒体探测、转码和封面结果；原型没有执行真实转码。
- 视频或封面上传拿到ID但尚未入库时只轮询查询，等待或失败不触发重新上传。原型增加手动“查询素材入库”“查询封面入库”及继续路径；封面等待入库阻止对应计划创建或追加。生产按平台频控、退避和超时监控调度，超时不是上传失败；文档核查不代表完整媒体链路已联调。
- Q02 `status`与`opt_status`分开：余额不足、预算不足、未到投放时间、配额超限、直播间未开播均展示独立原因和处理建议。已有计划不重复创建；余额、预算、配额和直播事项到千川处理后再核查，本期不新增充值或直播管理模块。
- Q05请求表未明确所有目标的追加容量上限，不把Q03创建时100条上限当作通用追加上限。以远端容量错误为依据停止追加，旧素材完整保留；运营在千川处理后通过二次确认重试原追加，仍以接口回执判断，不虚构“当前剩余素材容量”数据。

### 封面入库查询契约

- Q32：`GET https://ad.oceanengine.com/open_api/v1.0/qianchuan/image/get/`，Header必填`Access-Token`，请求必填`advertiser_id`；`filtering/page/page_size`选填。使用当前广告账户，不把其他账户的图片标识视为可复用。
- `filtering.image_ids/material_ids/signatures`只能选一种，每种不超过100个；有上传回执ID优先按`image_ids`，结果未知但已保存真实文件MD5时可按`signatures`查询。`image_mode/tags/sources`和配对的`start_time/end_time`是选填过滤；上传日期格式`yyyy-mm-dd`。页码默认1，每页默认20，文档未明确的page_size上限不猜测。
- 返回`data.list[].id/size/width/height/url/signature/material_id/filename/image_mode/tag/create_time/source/is_ai_create`以及`page_info`。`id`是创意使用的图片ID，`material_id`是报表素材ID，一张图片可能存在多个图片ID。按MD5查询得到多个候选时仍需核对原回执和具体图片ID，不能按文件名随意选取。
- 文档明确存在分钟级延迟，上传后不应立即获取并创建计划；查询为空不能证明上传失败。当前仅支持获取10000个图片素材，不承诺扫描超出范围的历史素材。应使用精确过滤、分页与有界重查；未完整查询或无法匹配则保持待确认。
- 预览URL仅1小时有效，且受同主体或敏感物料授权限制。拿不到URL不等于素材不存在或审核失败；本期不为了显示预览擅自扩大授权，也不把短期URL用作永久资源地址。
- 页面“请求地址”是千川`qianchuan/image/get/`，但代码示例仍写`/open_api/2/file/image/get/`，两者不一致。请求适配依据页面的请求地址及参数表，正式上线前通过官方调试或SDK/平台确认此差异，不能照抄示例路径。

### 零消耗审核及安全结束

Q08的消耗范围限制仍存在。Q02可以核对视频关联和计划状态，不能替代单素材审核；Q16空建议也不代表审核通过。本轮没有取得可靠覆盖全部零消耗新素材的审核订阅契约，因此没有新增虚假的“审核已通过”来源。

原型增加“零消耗素材暂无审核反馈”分支，保持待确认并保留旧素材；运营可在现有任务详情选择“保留旧视频并结束替换”，二次确认后将移除步骤记为已保留。新增素材不撤销，审核不改写，远端投放不暂停。后续即使收到审核通过也不自动重启本次移除。这使无审核证据的异常有明确出口，但**不意味着已经实现所有新素材的自动审核追踪**。

### 白名单证据及不开放项

- Q28 `GET /open_api/v1.0/qianchuan/tools/gray/`，必填advertiser_id、gray_keys；请求表列出的key含overall_marketing_white_list、star_material_white_list、alliance_white_list、assist_pure_roi_allcut。逐项返回success_list中的gray_key/in_gray/in_whitelist/aweme_ids及error_list。查询失败、缺key、未命中都不能当成支持。aweme_ids条件说明提到comm_roi，但该key未列在允许值中，需平台确认，不能猜用。
- Q29 `GET /open_api/v1.0/qianchuan/tools/allow_coupon/`必填advertiser_id、marketing_goal、campaign_scene、marketing_scene，aweme_ids/product_ids按对象传入；返回adv_allow_coupon及逐商品/抖音号allow_coupon。它说明标准投放场景，不足以证明本原型全部全域/乘方组合可开优惠券。不能仅用账户一个布尔值替代商品及目标范围校验。当前原型默认保持禁用，真实目标适用性未确认前不开放写入。
- 乘方、星选、联盟等应用与账户能力还需要正式权限及真实响应适配，不能由用户选择了“商品乘方”推断支持。原型目录和能力样例都不是授权证据。低数据/卡审自动移除及推广卡片写入继续禁用。

### 交付与正式接入边界

本轮完成的是上述关键异常的可操作原型、状态保护与单元测试。不能写成“全部千川接口已验收”。正式接入前仍需核验零消耗素材消息契约、图片库文档示例路径差异、各目标未公开的限制、白名单适用性，以及真实授权账户下的请求体、回执和错误码。缺少这些证据时按本文保守分支运行，不自动删除旧素材、不重新创建未知结果的计划、不把未知状态渲染为成功。
