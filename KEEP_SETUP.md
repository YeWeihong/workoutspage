# Keep 数据源配置

本仓库使用以下数据链路：

```text
Garmin 国际区 -> garmin-dailysync -> Garmin 中国区 -> Keep -> workoutspage
```

## GitHub Actions 配置

在仓库的 `Settings -> Secrets and variables -> Actions` 中添加：

- `KEEP_MOBILE`：Keep 登录手机号
- `KEEP_PASSWORD`：Keep 登录密码
- `MAPBOX_TOKEN`：Mapbox public token，用于构建地图页面

`.github/workflows/run_data_sync.yml` 已配置为：

- `RUN_TYPE: keep`
- 每天 UTC 03:00 和 15:00 自动同步
- 同步 Keep 的跑步、骑行和徒步数据
- 更新数据库、页面 JSON 和统计图；默认不额外下载 GPX，避免首次同步向仓库写入大量历史文件

也可以在 GitHub 的 Actions 页面手动运行 `Run Data Sync`。

## 本地运行

不要把手机号或密码直接写入代码。脚本未收到命令行参数时会安全地交互询问：

```powershell
python run_page/keep_sync.py --no-proxy
```

如果希望额外备份 GPX，可以加上 `--with-gpx`。如果本机网络不需要代理，可以使用 `--no-proxy`；GitHub Actions 中不需要该参数。

## 历史数据保护

迁移前的 Garmin 数据继续保存在 `run_page/data.db` 中。首次读取 Keep 时，脚本会依据开始时间、运动类型和距离识别由 Garmin 转入 Keep 的同一条运动，避免使用不同平台 ID 导致重复统计。

已检查过的 Keep ID 会保存在 `keep_sync_state.json`。这个文件属于同步状态，应与数据库一起保留；删除它不会删除运动数据，但会让脚本重新检查历史 Keep 记录。

## 当前限制

Keep 同步脚本目前支持：

- 跑步（running）
- 骑行（cycling）
- 徒步（hiking）

旧数据库中的游泳和其他运动会继续保留，但 Keep 链路能否提供新的游泳等记录取决于 Keep 接口支持。如果需要完整保留 Garmin 的所有运动类型，可以再把 `garmin-dailysync` 下载的 FIT 文件直接接入本仓库。
