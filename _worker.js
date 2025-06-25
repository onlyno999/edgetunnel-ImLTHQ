import { connect } from "cloudflare:sockets";

let 订阅路径 = "订阅路径";
let 验证UUID;
let 优选链接 = "https://raw.githubusercontent.com/ImLTHQ/edgetunnel/main/AutoTest.txt";
let 优选列表 = [];
let NAT64前缀 = "2001:67c:2960:6464::";
let DOH地址 = "1.1.1.1";

export default {
  async fetch(访问请求, env) {
    订阅路径 = env.SUB_PATH ?? 订阅路径;
    验证UUID = 生成UUID();
    优选链接 = env.TXT_URL ?? 优选链接;
    NAT64前缀 = env.NAT64 ?? NAT64前缀;
    DOH地址 = env.DOH ?? DOH地址;

    const url = new URL(访问请求.url);
    const 读取我的请求标头 = 访问请求.headers.get("Upgrade");
    const WS请求 = 读取我的请求标头 == "websocket";
    const 不是WS请求 = 读取我的请求标头?.toLowerCase() !== "websocket";

    const 反代前缀 = `/${encodeURIComponent(订阅路径)}/`;
    if (url.pathname.startsWith(反代前缀)) {
      let target = decodeURIComponent(url.pathname.slice(反代前缀.length));
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

    if (不是WS请求) {
      if (url.pathname == `/${encodeURIComponent(订阅路径)}`) {
        const 用户代理 = 访问请求.headers.get("User-Agent").toLowerCase();
        const 配置生成器 = { v2ray: v2ray配置文件, clash: clash配置文件, tips: 提示界面 };
        const 工具 = Object.keys(配置生成器).find((工具) => 用户代理.includes(工具));
        优选列表 = await 获取优选列表();
        const 生成配置 = 配置生成器[工具 || "tips"];
        return 生成配置(访问请求.headers.get("Host"));
      } else {
        return new Response(null, { status: 404 });
      }
    }

    if (WS请求) {
      return await 升级WS请求(访问请求);
    }
  },
};

async function 升级WS请求(访问请求) {
  const [客户端, WS接口] = new WebSocketPair();
  const 读取我的加密访问内容数据头 = 访问请求.headers.get('sec-websocket-protocol');
  const 解密数据 = 使用64位加解密(读取我的加密访问内容数据头);
  await 解析VL标头(解密数据, WS接口);
  return new Response(null, { status: 101, webSocket: 客户端 });
}

function 使用64位加解密(还原混淆字符) {
  还原混淆字符 = 还原混淆字符.replace(/-/g, "+").replace(/_/g, "/");
  const 解密数据 = atob(还原混淆字符);
  return Uint8Array.from(解密数据, (c) => c.charCodeAt(0)).buffer;
}

async function 解析VL标头(VL数据, WS接口) {
  if (验证VL的密钥(new Uint8Array(VL数据.slice(1, 17))) !== 验证UUID) return null;

  const 获取数据定位 = new Uint8Array(VL数据)[17];
  const 提取端口索引 = 18 + 获取数据定位 + 1;
  const 访问端口 = new DataView(VL数据.slice(提取端口索引, 提取端口索引 + 2)).getUint16(0);

  const 提取地址索引 = 提取端口索引 + 2;
  const 识别地址类型 = new Uint8Array(VL数据.slice(提取地址索引, 提取地址索引 + 1))[0];

  let 地址长度 = 0, 访问地址 = "", 地址信息索引 = 提取地址索引 + 1;
  switch (识别地址类型) {
    case 1:
      地址长度 = 4;
      访问地址 = new Uint8Array(VL数据.slice(地址信息索引, 地址信息索引 + 地址长度)).join(".");
      break;
    case 2:
      地址长度 = new Uint8Array(VL数据.slice(地址信息索引, 地址信息索引 + 1))[0];
      地址信息索引++;
      访问地址 = new TextDecoder().decode(VL数据.slice(地址信息索引, 地址信息索引 + 地址长度));
      break;
    case 3:
      地址长度 = 16;
      const dataView = new DataView(VL数据.slice(地址信息索引, 地址信息索引 + 地址长度));
      const ipv6 = [];
      for (let i = 0; i < 8; i++) ipv6.push(dataView.getUint16(i * 2).toString(16));
      访问地址 = ipv6.join(":");
      break;
  }

  const 写入初始数据 = VL数据.slice(地址信息索引 + 地址长度);

  let TCP接口;
  try {
    TCP接口 = await connect({ hostname: 访问地址, port: 访问端口, allowHalfOpen: true });
    await TCP接口.opened;
  } catch {
    try {
      const NAT64地址 = 识别地址类型 === 1 ? 转换IPv4到NAT64(访问地址) : 转换IPv4到NAT64(await 解析域名到IPv4(访问地址));
      TCP接口 = await connect({ hostname: NAT64地址, port: 访问端口 });
      await TCP接口.opened;
    } catch {
      return new Response("连接失败", { status: 502 });
    }
  }

  建立传输管道(WS接口, TCP接口, 写入初始数据);
}

function 转换IPv4到NAT64(ipv4地址) {
  const hex = ipv4地址.split(".").map(b => (+b).toString(16).padStart(2, "0"));
  return `[${NAT64前缀}${hex[0]}${hex[1]}:${hex[2]}${hex[3]}]`;
}

async function 解析域名到IPv4(域名) {
  const { Answer } = await (await fetch(`https://${DOH地址}/dns-query?name=${域名}&type=A`, { headers: { Accept: "application/dns-json" } })).json();
  return Answer.find(({ type }) => type === 1).data;
}

function 验证VL的密钥(arr, offset = 0) {
  const uuid = (
    转换密钥格式[arr[offset]] + 转换密钥格式[arr[offset+1]] +
    转换密钥格式[arr[offset+2]] + 转换密钥格式[arr[offset+3]] + "-" +
    转换密钥格式[arr[offset+4]] + 转换密钥格式[arr[offset+5]] + "-" +
    转换密钥格式[arr[offset+6]] + 转换密钥格式[arr[offset+7]] + "-" +
    转换密钥格式[arr[offset+8]] + 转换密钥格式[arr[offset+9]] + "-" +
    转换密钥格式[arr[offset+10]] + 转换密钥格式[arr[offset+11]] +
    转换密钥格式[arr[offset+12]] + 转换密钥格式[arr[offset+13]] +
    转换密钥格式[arr[offset+14]] + 转换密钥格式[arr[offset+15]]
  ).toLowerCase();
  return uuid;
}

const 转换密钥格式 = Array.from({ length: 256 }, (_, i) => (i + 256).toString(16).slice(1));

async function 建立传输管道(WS接口, TCP接口, 写入初始数据) {
  WS接口.accept();
  await WS接口.send(new Uint8Array([0, 0]).buffer);

  const writer = TCP接口.writable.getWriter();
  const reader = TCP接口.readable.getReader();
  if (写入初始数据) await writer.write(写入初始数据);

  WS接口.addEventListener("message", async (event) => {
    await writer.write(event.data);
  });

  ;(async () => {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) await WS接口.send(value);
    }
  })();

  while (true) {
    await new Promise(res => setTimeout(res, 10000));
    writer.write(new Uint8Array(0));
    WS接口.send('');
  }
}

function 生成UUID() {
  const 二十位 = Array.from(new TextEncoder().encode(订阅路径)).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 20).padEnd(20, "0");
  const 前八位 = 二十位.slice(0, 8);
  const 后十二位 = 二十位.slice(-12);
  return `${前八位}-0000-4000-8000-${后十二位}`;
}

async function 提示界面() {
  return new Response(`<title>订阅-${订阅路径}</title><style>body { font-size: 25px; text-align: center; }</style><strong>请把链接导入 Clash 或 V2Ray</strong>`, { status: 200, headers: { "Content-Type": "text/html;charset=utf-8" } });
}

async function 获取优选列表() {
  if (优选链接) {
    const res = await fetch(优选链接);
    return res.text().then(txt => txt.split("\n").map(line => line.trim()).filter(Boolean));
  }
  return [];
}

function 处理优选列表(优选列表, hostName) {
  优选列表.unshift(`${hostName}#原生节点`);
  return 优选列表.map((line, index) => {
    const [addr, name = `节点 ${index + 1}`] = line.split("#");
    const parts = addr.split(":");
    const port = Number(parts.pop()) || 443;
    return { 地址: parts.join(":"), 端口: port, 节点名字: name };
  });
}

function v2ray配置文件(hostName) {
  const 节点列表 = 处理优选列表(优选列表, hostName);
  const 配置内容 = 节点列表.map(({ 地址, 端口, 节点名字 }) => `vless://${验证UUID}@${地址}:${端口}?encryption=none&security=tls&sni=${hostName}&fp=chrome&type=ws&host=${hostName}&path=${encodeURIComponent("/?ed=2560")}#${节点名字}`).join("\n");
  return new Response(配置内容, { status: 200, headers: { "Content-Type": "text/plain;charset=utf-8" } });
}

function clash配置文件(hostName) {
  const 节点列表 = 处理优选列表(优选列表, hostName);
  const 配置项 = 节点列表.map(({ 地址, 端口, 节点名字 }) => `- name: ${节点名字}\n  type: vless\n  server: ${地址}\n  port: ${端口}\n  uuid: ${验证UUID}\n  udp: true\n  tls: true\n  sni: ${hostName}\n  network: ws\n  ws-opts:\n    path: "/?ed=2560"\n    headers:\n      Host: ${hostName}\n      User-Agent: Chrome`).join("\n");
  const 名字组 = 节点列表.map(n => `    - ${n.节点名字}`).join("\n");
  const 配置内容 = `proxies:\n${配置项}\n\nproxy-groups:\n- name: 海外规则\n  type: select\n  proxies:\n    - 延迟优选\n    - 故障转移\n    - DIRECT\n    - REJECT\n${名字组}\n- name: 国内规则\n  type: select\n  proxies:\n    - DIRECT\n    - 延迟优选\n    - 故障转移\n    - REJECT\n${名字组}\n- name: 广告屏蔽\n  type: select\n  proxies:\n    - REJECT\n    - DIRECT\n    - 延迟优选\n    - 故障转移\n${名字组}\n- name: 延迟优选\n  type: url-test\n  url: https://www.google.com/generate_204\n  interval: 30\n  tolerance: 50\n  proxies:\n${名字组}\n- name: 故障转移\n  type: fallback\n  url: https://www.google.com/generate_204\n  interval: 30\n  proxies:\n${名字组}\n\nrules:\n  - GEOSITE,category-ads-all,广告屏蔽\n  - GEOSITE,cn,国内规则\n  - GEOIP,CN,国内规则,no-resolve\n  - MATCH,海外规则`;
  return new Response(配置内容, { status: 200, headers: { "Content-Type": "text/plain;charset=utf-8" } });
}
