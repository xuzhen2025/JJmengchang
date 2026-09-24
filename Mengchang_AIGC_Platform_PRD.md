# 梦畅 AIGC 电商平台全维度产品需求文档 (PRD)

> **文档版本**: v4.0.0 (Enterprise Ultimate Detailed Edition)  
> **文档状态**: 官方正式发布 (Approved)  
> **更新时间**: 2026-07-29  
> **适用对象**: ChatGPT / Claude 需求分析、产品经理 (PM)、前端/后端工程团队、系统架构师、QA 测试团队  

---

## 一、 产品概述与全局架构 (Product Overview & Architecture)

### 1.1 产品定位与核心价值
**梦畅 AIGC 电商平台** 是一款面向电商商家、信息流广告投手、短视频矩阵运营团队、MCN 机构及视觉设计师的一站式智能视觉内容生产与广告投放系统。平台集成了大语言模型（Gemini 2.5/3.0）、图像/视频扩散模型（Diffusion, Veo/Sora 架构）以及 AI 数字人合成技术，覆盖“素材提取 -> AI 生成 -> 视频重制/裂变 -> 智能投放 -> 效果分析”的全闭环业务流程。

### 1.2 全局界面架构 (SaaS 4-Column Layout)
系统采用现代化 SaaS 4 栏响应式布局：
1. **左侧导航栏 (`Sidebar.tsx`)**: 包含首页概览、快速创作、Agent 创作、爆款复刻、AI 视频、AI 图片、画布、任务协作、素材管理、成片管理、资产库、投放管理及系统管理等 18 个核心功能视图。
2. **顶部控制条 (`Header`)**: 工作区切换器、全局快捷指令搜索 (`Cmd+K`)、Gemini Prompt 辅助引擎、算力点数面板。
3. **中央主工作区 (`Main Viewport`)**: 动态渲染加载当前激活视图的主界面。
4. **右侧渲染任务队列 (`RightQueue.tsx`)**: 全局后台异步渲染管理器，实时显示排队中、渲染中、已完成与失败的任务。

---

## 二、 首页概览模块 (Home Dashboard)

### 2.1 功能概述
用户登录后的主控制看板，整合全局数据检索、近 7 天生成趋势、算力余额审计、ROI 监测看板、金刚区快捷导航及爆款模版推荐。

### 2.2 核心字段定义
| 字段名称 | 英文标识 | 数据类型 | 必填 | 默认值 | 约束 / 说明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 搜索关键字 | `search_query` | String(64) | 否 | 无 | 支持素材名称、SKU、任务ID搜索 |
| 类目筛选 | `category_filter` | Enum | 是 | `ALL` | `ALL`(全部), `CLOTHES`(服饰), `BEAUTY`(美妆), `DIGITAL`(数码), `FOOD`(食品), `HOME`(家居) |
| 本月生成图片数 | `monthly_images_count`| Integer | 是 | 0 | 累计生成张数统计 |
| 本月生成视频数 | `monthly_videos_count`| Integer | 是 | 0 | 累计生成视频数统计 |
| 当前剩余算力 | `remaining_credits` | Integer | 是 | 0 | 当前可用点数 |
| 平均广告 ROI | `avg_ad_roi` | Decimal(4,2)| 是 | 0.00 | 实时对接投放平台回传算出的平均 ROI |
| 推荐模版ID | `template_id` | String(UUID)| 是 | 无 | 点击“做同款”调用的模板数据源 |

---

## 三、 快速创作模块 (Quick Creation)

### 3.1 功能概述
面向初级用户或急需出图场景的 3 步极速完成工具：上传商品图自动抠图 -> 选择场景风格 -> 智能批量产出 4 张商用级商品细节场景图。

### 3.2 核心字段定义
| 字段名称 | 英文标识 | 数据类型 | 必填 | 默认值 | 约束 / 说明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 商品原图 URL | `original_image_url` | String(255)| 是 | 无 | 原始上传商品图片路径 |
| 抠图主体 URL | `cutout_image_url` | String(255)| 是 | 无 | 背景擦除后的商品透明图 |
| 场景风格预设ID| `preset_style_id` | String(32) | 是 | `MODERN_MINIMAL`| 提供北欧暖阳、现代极简、高奢光影、自然户外等 12+ 预设 |
| 辅助描述词 | `extra_prompt` | String(200)| 否 | 无 | 用户额外补充的微调描述 |
| 批量生成张数 | `batch_size` | Integer | 是 | 4 | 固定 4 张多角度生成 |
| 输出分辨率 | `output_resolution` | String(16) | 是 | `2048x2048` | 高清电商规范画幅 |

---

## 四、 Agent 数字人与智能体创作模块 (Agent Creation)

### 4.1 功能概述
用于创建品牌专属 AI 数字人形象、克隆人声音色，并结合营销脚本自动生成 1080P 数字人口播带货视频或配置 AI 客服智能体。

### 4.2 核心字段定义
| 字段名称 | 英文标识 | 数据类型 | 必填 | 默认值 | 约束 / 说明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 数字人ID | `agent_id` | String(UUID)| 是 | 自动生成 | 数字人唯一主键 |
| 数字人名称 | `agent_name` | String(32) | 是 | 无 | 如“小畅-美妆专属主播” |
| 人脸形象类型 | `avatar_type` | Enum | 是 | `2D_REAL` | `2D_REAL`(真人口播), `3D_VIRTUAL`(虚拟二次元) |
| 音色克隆样本URL| `voice_sample_url` | String(255)| 是 | 无 | 长度 1-3 分钟高清无噪音频 |
| 口播文案脚本 | `script_content` | Text | 是 | 无 | 智能体朗读文案，最大 2000 字 |
| 语速调节 | `speech_rate` | Decimal(2,1)| 是 | 1.0 | 范围：0.8x - 1.5x |
| 背景音乐 URL | `bgm_url` | String(255)| 否 | 无 | 垫音背景音乐路径 |
| 合成视频分辨率 | `video_resolution`| Enum | 是 | `1080P` | `720P`, `1080P`, `4K` |

---

## 五、 爆款复刻与视频重制模块 (Same Style & Remake & Fission)

### 5.1 功能概述
包含爆款同款解析、视频去重重制以及短视频矩阵批量裂变三大功能，解决短视频搬运限流与防封查重问题。

### 5.2 核心字段定义

#### 5.2.1 爆款同款解析字段 (Same Style Analysis)
| 字段名称 | 英文标识 | 数据类型 | 必填 | 默认值 | 约束 / 说明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 爆款视频链接 | `source_video_url`| String(512)| 是 | 无 | 抖音/小红书/TikTok 视频分享链接 |
| 分镜抽帧列表 | `storyboard_frames`| Array[String]|是 | [] | 拆解出的分镜图片集合 |
| 提取原字幕文案 | `extracted_text` | Text | 是 | 无 | ASR 自动语音转文本结果 |
| 替代商品主体URL| `replace_product_url`|String(255)| 是 | 无 | 用户替换的自有商品图 |

#### 5.2.2 视频重制字段 (Video Remake)
| 字段名称 | 英文标识 | 数据类型 | 必填 | 默认值 | 约束 / 说明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 重写文案风格 | `rewrite_style` | Enum | 是 | `PLANTING` | `SUSPENSE`(悬念型), `PLANTING`(种草型), `PROMO`(促销型) |
| 画面像素翻转 | `flip_horizontal` | Boolean | 是 | true | 镜像翻转防查重 |
| 抽帧插帧比例 | `frame_skip_ratio`| Decimal(3,2)| 是 | 1.05 | 改变帧率播放节奏 |
| 新音色选择 | `tts_voice_id` | String(32) | 是 | `VOICE_FEMALE_1`| 用于生成新配音 |

#### 5.2.3 矩阵裂变字段 (Fission Generation)
| 字段名称 | 英文标识 | 数据类型 | 必填 | 默认值 | 约束 / 说明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 片头Hook片段列表| `hook_clips` | Array[String]|是 | [] | N 个吸引人的片头 |
| 场景演示片段列表| `demo_clips` | Array[String]|是 | [] | M 个商品展示片段 |
| 背景音乐库列表 | `bgm_tracks` | Array[String]|是 | [] | K 库不同 BGM |
| 裂变视频生成数量| `fission_count` | Integer | 是 | 20 | 单次最大裂变 100 条 |
| 查重安全等级 | `anti_duplicate_level`|Enum | 是 | `HIGH` | `MEDIUM`, `HIGH`, `MAX` |

---

## 六、 AI 视频生成模块 (AI Video Generation)

### 6.1 功能概述
基于 Gemini 与扩散模型的文生视频 (Text-to-Video) 与图生视频 (Image-to-Video) 引擎，专门针对电商展示动效优化。

### 6.2 核心字段定义
| 字段名称 | 英文标识 | 数据类型 | 必填 | 默认值 | 约束 / 说明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 动态模式 | `generation_mode`| Enum | 是 | `IMAGE_TO_VIDEO`| `TEXT_TO_VIDEO`, `IMAGE_TO_VIDEO` |
| 输入 Prompt | `prompt` | Text | 是 | 无 | 画面动态描述词 |
| 首帧参考图 URL | `first_frame_url`| String(255)| 图生视频必填 | 无 | 起始关键帧图片 |
| 运镜控制轨迹 | `camera_motion` | Enum | 是 | `ZOOM_IN` | `ZOOM_IN`, `ZOOM_OUT`, `PAN_LEFT`, `PAN_RIGHT`, `ROLL` |
| 运镜移动速度 | `motion_speed` | Integer | 是 | 2 | 范围：1(平缓) - 5(剧烈) |
| 视频时长 | `duration_seconds`| Integer | 是 | 4 | 选定：4秒, 8秒, 12秒 |
| 渲染帧率 | `target_fps` | Integer | 是 | 30 | 选定：24fps, 30fps, 60fps |

---

## 七、 AI 图像生成模块 (AI Image Generation)

### 7.1 功能概述
专业级 AI 绘画实验室，涵盖文生图、图生图、商品背景替换以及 AI 模特换装。

### 7.2 核心字段定义
| 字段名称 | 英文标识 | 数据类型 | 必填 | 默认值 | 约束 / 说明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 图像生成模式 | `image_mode` | Enum | 是 | `PRODUCT_BG` | `TEXT_TO_IMG`, `IMG_TO_IMG`, `PRODUCT_BG`, `MODEL_FASHION` |
| 正向提示词 | `positive_prompt`| Text | 是 | 无 | 包含“AI 帮写 Prompt”自动扩写 |
| 负向提示词 | `negative_prompt`| Text | 否 | `blurry, bad quality`| 排除的不良特征 |
| 画幅比例 | `aspect_ratio` | Enum | 是 | `3:4` | `1:1`(主图), `3:4`(小红书), `9:16`(竖屏), `16:9`(横屏) |
| 采样步数 | `steps` | Integer | 是 | 25 | 范围：15 - 50 |
| CFG引导系数 | `cfg_scale` | Decimal(3,1)| 是 | 7.5 | 范围：1.0 - 20.0 |
| 随机种子 | `seed` | Long | 是 | -1 | -1 为随机生成 |
| 模特人脸特征图 | `model_face_url` | String(255)| 模特换装必填 | 无 | 保持人脸一致性 |

---

## 八、 无限画布 / 工作流引擎 (Infinite Canvas Workflow)

### 8.1 功能概述
面向高阶设计师的基于节点 (Node-based) 的可视化图形与视频工程编辑引擎。

### 8.2 核心字段定义

#### 8.2.1 画布状态字段 (Canvas State)
| 字段名称 | 英文标识 | 数据类型 | 说明 |
| :--- | :--- | :--- | :--- |
| 画布工程ID | `canvas_id` | String(UUID) | 唯一画布标识 |
| 缩放比例 | `zoom_level` | Decimal(4,2) | 范围：0.10 (10%) - 5.00 (500%) |
| 画布中心X坐标 | `pan_x` | Decimal(8,2) | 视口平移偏移量 |
| 画布中心Y坐标 | `pan_y` | Decimal(8,2) | 视口平移偏移量 |

#### 8.2.2 节点数据结构字段 (Canvas Node)
| 字段名称 | 英文标识 | 数据类型 | 说明 |
| :--- | :--- | :--- | :--- |
| 节点ID | `node_id` | String(UUID) | 节点唯一标识 |
| 节点类型 | `node_type` | Enum | `PROMPT_NODE`, `IMG_INPUT_NODE`, `SD_RENDER_NODE`, `VIDEO_GEN_NODE`, `UPSCALE_NODE` |
| 节点X位置 | `pos_x` | Decimal(8,2) | 画布绝对坐标 |
| 节点Y位置 | `pos_y` | Decimal(8,2) | 画布绝对坐标 |
| 节点输入端口集 | `inputs` | Array[Port] | 包含端口ID与数据类型 (`text` / `image` / `video`) |
| 节点输出端口集 | `outputs` | Array[Port] | 输出数据流指针 |
| 运行状态 | `run_status` | Enum | `IDLE`(空闲), `RUNNING`(运行中), `SUCCESS`(成功), `ERROR`(失败) |

---

## 九、 任务协作模块 (Task Collaboration)

### 9.1 功能概述
提供企业级团队内部的设计工单、投放工单流转与跨部门审评协同。

### 9.2 核心字段定义
| 字段名称 | 英文标识 | 数据类型 | 必填 | 默认值 | 约束 / 说明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 工单ID | `task_id` | String(UUID)| 是 | 自动生成 | 唯一工单编号 |
| 工单标题 | `title` | String(128)| 是 | 无 | 如“双十一女鞋主图设计组” |
| 工单类型 | `task_type` | Enum | 是 | `DESIGN` | `DESIGN`(设计制作), `AD_CAMPAIGN`(投放准备), `AUDIT`(审核) |
| 指派责任人ID | `assignee_id` | String(UUID)| 是 | 无 | 关联用户 `user_id` |
| 关联商品 SKU | `sku_code` | String(64) | 否 | 无 | 电商 SKU 编码 |
| 工单优先级 | `priority` | Enum | 是 | `MEDIUM` | `LOW`, `MEDIUM`, `HIGH`, `URGENT` |
| 工单状态 | `status` | Enum | 是 | `PENDING` | `PENDING`(待处理), `IN_PROGRESS`(制作中), `AUDITING`(审核中), `COMPLETED`(已完成) |
| 截止时间 | `due_date` | Timestamp | 是 | 无 | ISO 8601 |

---

## 十、 素材管理模块 (Materials Management)

### 10.1 功能概述
对原始上传的产品图、模特图、场景背景图及背景音乐音效进行集中标签化资产管理。

### 10.2 核心字段定义
| 字段名称 | 英文标识 | 数据类型 | 必填 | 默认值 | 约束 / 说明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 素材资产ID | `material_id` | String(UUID)| 是 | 自动生成 | 主键 |
| 素材文件名 | `file_name` | String(128)| 是 | 无 | 原始文件名 |
| 文件存储路径 | `storage_url` | String(512)| 是 | 无 | 云端 CDN 路径 |
| 媒体类型 | `media_type` | Enum | 是 | `IMAGE` | `IMAGE`(图片), `VIDEO`(视频), `AUDIO`(音频) |
| 主色彩 HEX 码 | `dominant_color`| String(7) | 否 | `#FFFFFF` | 颜色检索标签（如：`#FF0000`） |
| 素材尺寸/分辨率| `dimensions` | String(32) | 是 | `1920x1080`| 格式：宽x高 |
| 文件占用大小 | `file_size_bytes`| Long | 是 | 0 | 单位：Bytes |
| 关联标签数组 | `tags` | Array[String]|是 | [] | 如：[`北欧`, `女装`, `爆款`] |

---

## 十一、 成片管理模块 (Finished Content Management)

### 11.1 功能概述
管理全平台经过 AI 渲染产出成的最终图片与视频资产，提供全屏预览、参数复用、格式转换与导出。

### 11.2 核心字段定义
| 字段名称 | 英文标识 | 数据类型 | 必填 | 默认值 | 约束 / 说明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 成片ID | `finished_id` | String(UUID)| 是 | 自动生成 | 唯一标识 |
| 作品标题 | `title` | String(128)| 是 | 无 | 作品显示名称 |
| 作品预览缩略图 | `thumbnail_url` | String(512)| 是 | 无 | 低清晰度缩略图 |
| 高清成品 URL | `hd_file_url` | String(512)| 是 | 无 | 导出用原图/视频路径 |
| 生成耗时秒数 | `render_cost_sec`| Integer | 是 | 0 | 记录渲染性能 |
| 消耗算力点数 | `credits_consumed`|Integer | 是 | 0 | 扣除点数明细 |
| 完整 Prompt 参数| `generation_params`|JSON | 是 | {} | 包含 Seed, Sampler, CFG 等复用参数 |

---

## 十二、 资产库与详情页套图组 (Asset Library & Detail Sets)

### 12.1 功能概述
针对淘宝、天猫、京东、拼多多电商详情页，自动将 AI 主图衍生为包含“主图、卖点图、细节图、场景图、参数图”的 5 张标准电商套图。

### 12.2 核心字段定义
| 字段名称 | 英文标识 | 数据类型 | 必填 | 默认值 | 约束 / 说明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 套图工程ID | `detail_set_id` | String(UUID)| 是 | 自动生成 | 主键 |
| 商品名称 | `product_name` | String(128)| 是 | 无 | 详情页展示标题 |
| 核心卖点文案 | `selling_points` | Array[String]|是 | [] | 最多 5 核心卖点 |
| 首图/主图 URL | `main_pic_url` | String(255)| 是 | 无 | 800x800 主图 |
| 卖点特写图 URL | `feature_pic_url`| String(255)| 是 | 无 | 高清放大卖点图 |
| 场景效果图 URL | `scene_pic_url` | String(255)| 是 | 无 | 场景氛围图 |
| 规格参数图 URL | `spec_pic_url` | String(255)| 是 | 无 | 参数表格图 |
| 详情页长图拼接URL| `long_page_url` | String(255)| 是 | 无 | 拼接好的长详情图 |

---

## 十三、 投放管理模块 (Ad Delivery Management)

### 13.1 功能概述
对接巨量千川、小红书聚光、腾讯广告及 TikTok Ads 平台，实现一键下发素材与创建广告计划，并监控 ROI。

### 13.2 核心字段定义
| 字段名称 | 英文标识 | 数据类型 | 必填 | 默认值 | 约束 / 说明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 投放计划ID | `campaign_id` | String(UUID)| 是 | 自动生成 | 系统内部计划主键 |
| 目标广告平台 | `ad_platform` | Enum | 是 | `OCEAN_ENGINE`| `OCEAN_ENGINE`(巨量千川), `RED_BOOK`(小红书聚光), `TIKTOK_ADS` |
| 广告主账号ID | `advertiser_id` | String(64) | 是 | 无 | 第三方平台授权账号 ID |
| 绑定视频素材ID | `video_asset_id`| String(UUID)| 是 | 无 | 投放使用的 AIGC 视频 |
| 日预算金额 | `daily_budget` | Decimal(10,2)|是 | 500.00 | 单位：元/美元 |
| 人群定向包ID | `audience_target_id`|String(64) | 是 | 无 | 目标受众群体标识 |
| 展现量 (Impressions)| `stat_impressions`| Long | 是 | 0 | 接口实时回传统计 |
| 点击率 (CTR) | `stat_ctr` | Decimal(5,4)| 是 | 0.0000 | 算法：点击量 / 展现量 |
| 转化率 (CVR) | `stat_cvr` | Decimal(5,4)| 是 | 0.0000 | 算法：转化量 / 点击量 |

---

## 十四、 系统管理模块 (System Administration)

### 14.1 组织部门架构管理 (Org Structure)
| 字段名称 | 英文标识 | 数据类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| 部门ID | `department_id` | String(UUID) | 是 | 主键 |
| 部门名称 | `name` | String(64) | 是 | 同级下唯一 |
| 上级部门ID | `parent_id` | String(UUID) | 否 | 根节点为 null |
| 部门负责人ID | `leader_user_id` | String(UUID) | 否 | 关联用户表 |
| 算力月度配额 | `monthly_credit_limit`| Integer | 是 | 0 表示无限额 |

### 14.2 人员账号管理 (User Accounts)
| 字段名称 | 英文标识 | 数据类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| 用户ID | `user_id` | String(UUID) | 是 | 系统全局唯一主键 |
| 登录账号 | `username` | String(32) | 是 | 唯一登录凭证 |
| 真实姓名 | `real_name` | String(32) | 是 | 显示名称 |
| 手机号码 | `phone` | String(11) | 是 | 国内11位手机号 |
| 账号状态 | `account_status` | Enum | 是 | `ACTIVE`(正常), `FROZEN`(冻结), `OFFBOARDED`(已离职) |

### 14.3 角色与权限矩阵 (RBAC System)
系统内默认角色包含：**超级管理员**、**运营主管**、**视觉设计师**、**信息流投手**、**审核员**。
细粒度控制包含 `sys:user:manage`, `sys:credits:allocate`, `tool:canvas:create`, `tool:aigc:generate`, `ad:delivery:create` 等 30+ 项 API 级操作权限。

### 14.4 系统操作安全日志 (Audit Logs)
记录操作人、访问 IP、模块名称、操作类型 (`CREATE`, `UPDATE`, `DELETE`, `EXPORT`)、变动前后 JSON 镜像、响应耗时及执行状态，日志加密存储 180 天。

---

## 十五、 后端 API 接口与非功能约束 (API & NFR Standards)

### 15.1 提示词智能改写接口
- **Endpoint**: `POST /api/write-prompt`
- **Request Body**:
  ```json
  {
    "type": "AI 图像生成",
    "shortDescription": "精美汉服女性模特，古风楼阁场景",
    "style": "电影质感，柔和光影"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "prompt": "Stunning Hanfu fashion model in traditional pavilion, soft volumetric morning light, cinematic depth of field, 8k resolution --ar 3:4"
  }
  ```

---

## 十六、 总结说明

本需求文档覆盖了梦畅 AIGC 电商平台全部 13 个核心维度的细化规范与字段定义表。可直接复制或下载 Markdown 文件上传至 ChatGPT 进行全局架构分析。
