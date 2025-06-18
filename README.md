# Edge Tunnel

Edge Tunnel 是一个基于 Cloudflare Pages 的免费代理解决方案, 配置精简, 适合新手快速上手

## 项目特点

- **免费**：利用 Cloudflare Pages 免费托管
- **简单**：Fork 即可使用, 无需复杂配置
- **易用**：通过环境变量灵活配置
- **高速**：依托 Cloudflare 全球网络加速
- **多种方案**：支持 SOCKS5, 反代, NAT64
- **兼容性强**：支持 v2ray 和 clash 客户端
- **自动同步**：支持 GitHub Actions 自动同步上游仓库
- **社区支持**：欢迎参与讨论和贡献代码

> **欢迎各位大佬指正代码中存在的问题！**

[![Stargazers over time](https://starchart.cc/ImLTHQ/edgetunnel.svg?variant=adaptive)](https://starchart.cc/ImLTHQ/edgetunnel)

如果本项目对您有帮助, 请点 Star 支持 !

## 使用方法

1. **Fork 本项目**
2. **创建 Cloudflare Pages**
- **导入您 Fork 的仓库**
- **添加环境变量**
- **保存并部署**
3. **导入订阅并开始使用**

<details>
<summary><strong>建议操作：启用 GitHub Actions 同步上游仓库</strong></summary>

1. 进入您 Fork 的仓库
2. 打开 `Actions` 选项卡, 点击 `Enable workflow`, 选择 `上游同步`
3. 启用后可自动同步作者的最新更新

</details>

<details>
<summary><strong>反代说明</strong></summary>

- 并非指的是 `PROXY_IP`, 而是用于没有代理工具场景的简易代理
- 使用方法: https://域名/订阅路径/https://github.com/ImLTHQ/
- 你可以用于下载国外资源, 国内直连可能速度较慢

请勿用于非法用途

</details>

## 环境变量说明

| 变量名 | 示例值 | 说明 |
|-|-|-|
| `SUB_PATH` | `订阅路径` | 域名/`订阅路径` |
| `TXT_URL` | `https://raw.domain.com/CFST.txt` | 优选 IP 列表, 格式：`地址:端口#节点名称`, 端口默认 443 |
| `PROXY_IP` | `ts.hpc.tw:443` | 反代地址和端口, 端口不填默认 443 |
| `SOCKS5` | `账号:密码@地址:端口` | SOCKS5 代理配置 |
| `SOCKS5_GLOBAL` | `true` | 是否启用全局 SOCKS5 代理 |
| `DOH` | `1.1.1.1` | DoH 地址 |
| `NAT64` | `2001:67c:2960:6464::` | NAT64 IPv6 地址前缀 |

## 提醒

- CloudFlare 明文禁止优选IP和使用CF Pages部署代理, 封号风险自己承担
- 部分用户可能需要使用v2ray的分片功能才能正常上网, 给Pages绑定自定义域名也许可以解决

## 感谢
- [zizifn](https://github.com/zizifn) 原作者
- [XIU2](https://github.com/XIU2) 优选IP程序作者
