import { connect } from "cloudflare:sockets";

// 配置区块
let 订阅路径 = "订阅路径";
let 验证UUID;
let 优选链接 = "https://raw.githubusercontent.com/ImLTHQ/edgetunnel/main/AutoTest.txt";
let 优选列表 = [];
let NAT64前缀 = "2001:67c:2960:6464::";
let DOH地址 = "1.1.1.1";

// 网页入口
export default {
  async fetch(访问请求, env) {
    订阅路径 = env.SUB_PATH ?? 订阅路径;
    验证UUID = 生成UUID();
    优选链接 = env.TXT_URL ?? 优选链接;
    NAT64前缀 = env.NAT64 ?? NAT64前缀;
    DOH地址 = env.DOH ?? DOH地址;

    const url = new URL(访问请求.url);
    const 读取我的请求标头 = 访问请求.headers.get("Upgrade");
    const WS请求 = 读取我的请求标头 === "websocket";

    // /订阅路径/反代
    const 反代前缀 = `/${encodeURIComponent(订阅路径)}/`;
    if (url.pathname.startsWith(反代前缀)) {
      const target = decodeURIComponent(url.pathname.slice(反代前缀.length));
      try {
        const 请求对象 = new Request(target + url.search, {
          method: 访问请求.method,
          headers: 访问请求.headers,
          body: 访问请求.body,
        });
        return await fetch(请求对象);
      } catch {
        return new Response(null, { status: 404 });
      }
    }

    if (!WS请求) {
      if (url.pathname === `/${encodeURIComponent(订阅路径)}`) {
        优选列表 = await 获取优选列表();
        return v2ray配置文件(访问请求.headers.get("Host"));
      } else {
        return new Response(null, { status: 404 });
      }
    }

    if (WS请求) {
      return await 升级WS请求(访问请求);
    }
  },
};

// v2ray 配置文件
function v2ray配置文件(hostName) {
  const 节点列表 = 处理优选列表(优选列表, hostName);
  const 配置内容 = 节点列表
    .map(({ 地址, 端口, 节点名字 }) => {
      return `vless://${验证UUID}@${地址}:${端口}?encryption=none&security=tls&sni=${hostName}&fp=chrome&type=ws&host=${hostName}&path=${encodeURIComponent("/?ed=2560")}#${节点名字}`;
    })
    .join("\n");

  return new Response(配置内容, {
    status: 200,
    headers: { "Content-Type": "text/plain;charset=utf-8" },
  });
}

// 处理优选地址
function 处理优选列表(优选列表, hostName) {
  优选列表.unshift(`${hostName}#原生节点`);
  return 优选列表.map((行, index) => {
    const [地址端口, 节点名字 = `节点 ${index + 1}`] = 行.split("#");
    const 拆分 = 地址端口.split(":");
    const 端口 = Number(拆分.pop()) || 443;
    const 地址 = 拆分.join(":");
    return { 地址, 端口, 节点名字 };
  });
}

// 订阅 UUID
function 生成UUID() {
  const 二十位 = Array.from(new TextEncoder().encode(订阅路径))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 20)
    .padEnd(20, "0");
  return `${二十位.slice(0, 8)}-0000-4000-8000-${二十位.slice(-12)}`;
}

// 获取优选地址列表
async function 获取优选列表() {
  if (!优选链接) return [];
  const 响应 = await fetch(优选链接);
  const 文本 = await 响应.text();
  return 文本.split("\n").map(l => l.trim()).filter(Boolean);
}

// WebSocket 握手流程（其余逻辑保留不动）...
// 你可以根据上面的需求再进一步精简，如不需要 WS 功能也可去掉。
