// Interactive Terminal - Maxed Out Edition
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('term-input');
  const output = document.getElementById('term-output');
  if (!input || !output) return;

  const commandHistory = [];
  let historyIndex = -1;
  let currentDir = '/home/devtint';
  
  // Virtual file system
  const filesystem = {
    '/': ['home/', 'etc/', 'var/', 'usr/', 'tmp/', 'opt/'],
    '/home': ['devtint/'],
    '/home/devtint': ['projects/', 'tools/', 'scripts/', 'wordlists/', '.config/', 'Desktop/', 'Downloads/', 'recon.sh', 'scan.py', 'targets.txt', 'notes.md', '.bashrc', '.zshrc', '.gitconfig'],
    '/home/devtint/projects': ['NUCLEI_CNM/', 'SecurityHeaderScanner/', 'GeminiSheeridVerify/', 'Js-And-Endpoints-scanner/', 'r3verse_shells_gen/', 'README.md'],
    '/home/devtint/tools': ['nuclei/', 'burp/', 'ffuf/', 'sqlmap/', 'custom-scripts/', 'install.sh'],
    '/home/devtint/scripts': ['recon-auto.sh', 'subdomain-enum.py', 'header-check.py', 'port-scan.sh', 'vuln-check.sh'],
    '/home/devtint/wordlists': ['common.txt', 'subdomains.txt', 'passwords.txt', 'directories.txt', 'api-endpoints.txt', 'sqli-payloads.txt'],
    '/home/devtint/.config': ['nvim/', 'alacritty/', 'i3/', 'polybar/'],
    '/home/devtint/Desktop': ['targets/', 'reports/', 'poc.py'],
    '/home/devtint/Downloads': ['burpsuite_pro.jar', 'nuclei-templates.zip', 'rockyou.txt.gz'],
    '/etc': ['passwd', 'shadow', 'hosts', 'resolv.conf', 'ssh/'],
    '/var': ['log/', 'www/', 'tmp/'],
    '/var/log': ['auth.log', 'syslog', 'kern.log', 'nginx/'],
    '/tmp': ['scan-results.txt', 'temp-output/', '.X0-lock'],
    '/opt': ['exploit-db/', 'wordlists/', 'tools/'],
  };

  // File contents
  const fileContents = {
    'targets.txt': `# Bug Bounty Targets - Q1 2026
hackerone.com
bugcrowd.com
synack.com
yeswehack.com
intigriti.com
# Private Programs
redacted-corp.local
test-target.internal`,
    'notes.md': `# Security Research Notes

## Current Focus
- Web application security testing
- API vulnerability research
- Subdomain enumeration & takeover
- Custom nuclei template development

## Recent Findings
- CORS misconfiguration in payment APIs
- IDOR in user profile endpoints
- Rate limiting bypass techniques

## Tools Stack
- Primary: Nuclei, Burp Suite Pro, ffuf
- Recon: subfinder, httpx, dnsx, waybackurls
- Manual: Custom Python scripts

## Methodology
1. Scope review & asset discovery
2. Subdomain enumeration
3. Port scanning & service detection
4. Technology fingerprinting
5. Vulnerability scanning
6. Manual testing & exploitation`,
    'recon.sh': `#!/bin/bash
# Automated Reconnaissance Script v2.1
# Author: devtint

set -e
TARGET=\$1
OUTPUT_DIR="./recon/\$TARGET"

echo "[*] Starting recon on \$TARGET"
mkdir -p \$OUTPUT_DIR

# Subdomain enumeration
echo "[+] Running subfinder..."
subfinder -d \$TARGET -silent -o \$OUTPUT_DIR/subs.txt

# Additional sources
echo "[+] Running amass..."
amass enum -passive -d \$TARGET >> \$OUTPUT_DIR/subs.txt

# Remove duplicates
sort -u \$OUTPUT_DIR/subs.txt -o \$OUTPUT_DIR/subs.txt

# Probe for live hosts
echo "[+] Probing with httpx..."
cat \$OUTPUT_DIR/subs.txt | httpx -silent -status-code -title -o \$OUTPUT_DIR/live.txt

# Port scanning on live hosts
echo "[+] Running nmap..."
nmap -iL \$OUTPUT_DIR/live.txt -sV -sC -oA \$OUTPUT_DIR/nmap_results

echo "[✓] Recon complete! Results in \$OUTPUT_DIR"`,
    'scan.py': `#!/usr/bin/env python3
"""
Security Header Scanner v3.0
Author: devtint
"""

import httpx
import argparse
from rich.console import Console
from rich.table import Table

SECURITY_HEADERS = [
    'X-Frame-Options',
    'X-Content-Type-Options',
    'Strict-Transport-Security',
    'Content-Security-Policy',
    'X-XSS-Protection',
    'Permissions-Policy',
    'Referrer-Policy',
]

def scan_headers(url: str) -> dict:
    """Scan target for security headers."""
    client = httpx.Client(follow_redirects=True)
    response = client.get(url)
    
    results = {}
    for header in SECURITY_HEADERS:
        results[header] = response.headers.get(header, None)
    
    return results

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--target', '-t', required=True)
    parser.add_argument('--verbose', '-v', action='store_true')
    args = parser.parse_args()
    
    console = Console()
    results = scan_headers(args.target)
    
    # Display results
    table = Table(title=f"Security Headers: {args.target}")
    table.add_column("Header", style="cyan")
    table.add_column("Status", style="green")
    table.add_column("Value", style="dim")
    
    for header, value in results.items():
        status = "✓" if value else "✗"
        table.add_row(header, status, value or "Missing")
    
    console.print(table)

if __name__ == "__main__":
    main()`,
    '.bashrc': `# ~/.bashrc
export PATH="$HOME/.local/bin:$PATH"
export EDITOR="nvim"

# Aliases
alias ll='ls -la'
alias grep='grep --color=auto'
alias nmap='nmap -v'
alias py='python3'

# Security tools
alias nuclei='nuclei -silent'
alias ff='ffuf -c'
alias burp='java -jar ~/tools/burp/burpsuite_pro.jar'

# Custom functions
recon() { ~/scripts/recon-auto.sh "$1"; }
headers() { python3 ~/scan.py -t "$1"; }`,
    '.zshrc': `# ~/.zshrc
export ZSH="$HOME/.oh-my-zsh"
ZSH_THEME="powerlevel10k/powerlevel10k"
plugins=(git zsh-autosuggestions zsh-syntax-highlighting)

source $ZSH/oh-my-zsh.sh

# Custom prompt
PROMPT='%F{cyan}%n%f@%F{green}%m%f:%F{blue}%~%f$ '

# Security aliases
alias scan='nuclei -t ~/nuclei-templates/'
alias targets='cat ~/targets.txt'`,
    '.gitconfig': `[user]
    name = devtint
    email = devtint@users.noreply.github.com
[core]
    editor = nvim
[alias]
    st = status
    co = checkout
    br = branch
    ci = commit
    lg = log --oneline --graph`,
    '/etc/passwd': `root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
devtint:x:1000:1000:Tint Naing Win:/home/devtint:/bin/zsh
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
mysql:x:27:27:MySQL Server:/var/lib/mysql:/bin/false`,
    '/etc/hosts': `127.0.0.1   localhost
127.0.1.1   kali
::1         localhost ip6-localhost ip6-loopback

# CTF targets
10.10.10.1  hackthebox.local
192.168.1.100 target.local`,
  };

  // Command database with responses
  const commands = {
    help: () => `<span class="info">Available commands:</span>

<span class="highlight">Navigation:</span>
  pwd           - Print working directory
  ls [dir]      - List directory contents
  ls -la        - List with details
  cd [dir]      - Change directory
  cat [file]    - Display file contents
  head [file]   - First 10 lines
  tree          - Directory tree
  find [name]   - Find files

<span class="highlight">System:</span>
  whoami        - Current user
  hostname      - Show hostname
  id            - User & group IDs
  groups        - User groups  
  uname -a      - System info
  uptime        - System uptime
  date          - Current date/time
  cal           - Calendar
  df -h         - Disk usage
  free -h       - Memory usage
  ps aux        - Running processes
  top           - Process monitor
  env           - Environment vars
  echo [text]   - Print text
  history       - Command history
  neofetch      - System info + ASCII
  screenfetch   - Alt system info
  clear         - Clear terminal

<span class="highlight">Security Tools:</span>
  nmap [target]     - Port scanner
  nuclei [target]   - Vuln scanner
  subfinder [dom]   - Subdomain enum
  httpx             - HTTP probe
  ffuf              - Dir fuzzer
  gobuster          - Dir/DNS brute
  dirsearch         - Dir scanner
  nikto             - Web scanner
  burp              - Burp Suite info
  sqlmap            - SQLi scanner
  wpscan            - WordPress scan
  whatweb           - Web fingerprint
  waybackurls       - Archive URLs
  gau               - Get All URLs
  paramspider       - Parameter finder
  dalfox            - XSS scanner
  ssrf-sheriff      - SSRF detection
  secretfinder      - JS secrets
  linkfinder        - JS endpoints

<span class="highlight">Network:</span>
  ping [host]   - Ping host
  curl [url]    - HTTP request
  wget [url]    - Download file
  dig [domain]  - DNS lookup
  whois [dom]   - WHOIS lookup
  traceroute    - Trace route
  netstat       - Network stats
  ss -tuln      - Socket stats
  ifconfig      - Network interfaces
  ip addr       - IP addresses

<span class="highlight">CTF Utilities:</span>
  base64 [text]     - Encode to base64
  base64 -d [text]  - Decode base64
  md5sum [text]     - MD5 hash
  sha256sum [text]  - SHA256 hash
  rot13 [text]      - ROT13 cipher
  hex [text]        - Text to hex
  unhex [hex]       - Hex to text
  strings           - Extract strings
  xxd               - Hex dump
  binwalk           - Binary analysis
  hashcat           - Hash cracker
  john              - John the Ripper

<span class="highlight">Development:</span>
  python3 --version - Python version
  node --version    - Node.js version
  npm --version     - npm version
  git status        - Git status
  git log           - Git history
  git branch        - Git branches
  npm run build     - Build project
  pip list          - Python packages
  docker ps         - Containers
  make              - Build project
  gcc --version     - GCC version

<span class="highlight">About:</span>
  about         - About me
  skills        - My skills
  projects      - My projects
  contact       - Contact info
  socials       - Social links
  resume        - Download resume
  certifications - My certs
  experience    - Work experience
  education     - Education

<span class="highlight">Fun & Easter Eggs:</span>
  cowsay [msg]  - ASCII cow
  fortune       - Random quote
  matrix        - Matrix effect
  hack          - "Hacking" animation
  cmatrix       - Matrix rain
  sl            - Steam locomotive
  figlet [txt]  - ASCII art text
  lolcat        - Rainbow text
  asciiquarium  - ASCII aquarium
  pipes         - Pipes screensaver
  hollywood     - Hacker movie
  joke          - Random joke
  weather       - Weather report
  rickroll      - Never gonna...
  vim           - Exit vim? Good luck!
  emacs         - Editor war
  nano          - The sensible choice

<span class="info">Pro tips:</span>
  ↑/↓  Navigate command history
  Tab  Auto-complete commands
  Try combining commands creatively!`,

    // System commands
    whoami: () => '<span class="success">devtint</span>',
    hostname: () => '<span class="success">kali</span>',
    id: () => 'uid=1000(devtint) gid=1000(devtint) groups=1000(devtint),27(sudo),44(video),109(netdev)',
    groups: () => 'devtint sudo video netdev docker wireshark',
    'uname -a': () => 'Linux kali 6.1.0-kali9-amd64 #1 SMP PREEMPT_DYNAMIC Kali 6.1.27-1kali1 x86_64 GNU/Linux',
    uname: () => 'Linux',
    'uname -r': () => '6.1.0-kali9-amd64',
    uptime: () => ` ${new Date().toLocaleTimeString()} up 3 days, 7:42, 2 users, load average: 0.52, 0.58, 0.59`,
    date: () => new Date().toString(),
    cal: () => {
      const d = new Date();
      const month = d.toLocaleString('en-US', { month: 'long' });
      const year = d.getFullYear();
      return `<span class="info">     ${month} ${year}
Su Mo Tu We Th Fr Sa
          1  2  3  4
 5  6  7  8  9 10 11
12 13 14 15 16 17 18
19 <span class="warning">20</span> 21 22 23 24 25
26 27 28</span>`;
    },
    
    // Filesystem navigation - dynamic
    pwd: () => currentDir,
    
    cd: (args) => {
      if (!args || args === '~') {
        currentDir = '/home/devtint';
        return '';
      }
      if (args === '..') {
        const parts = currentDir.split('/').filter(p => p);
        if (parts.length > 0) {
          parts.pop();
          currentDir = '/' + parts.join('/') || '/';
        }
        return '';
      }
      if (args === '/') {
        currentDir = '/';
        return '';
      }
      // Check if directory exists
      let targetPath = args.startsWith('/') ? args : currentDir + '/' + args;
      targetPath = targetPath.replace(/\/+/g, '/').replace(/\/$/, '');
      if (filesystem[targetPath]) {
        currentDir = targetPath;
        return '';
      }
      return `<span class="error">cd: ${args}: No such file or directory</span>`;
    },
    
    ls: (args) => {
      const showAll = args && args.includes('-a');
      const showLong = args && args.includes('-l');
      const dir = filesystem[currentDir] || [];
      
      if (showLong) {
        let output = `total ${dir.length * 4}\n`;
        if (showAll) {
          output += `drwxr-xr-x 8 devtint devtint 4096 Feb 20 14:30 <span class="info">.</span>\n`;
          output += `drwxr-xr-x 3 devtint devtint 4096 Jan 15 09:00 <span class="info">..</span>\n`;
        }
        dir.forEach(item => {
          if (item.startsWith('.') && !showAll) return;
          const isDir = item.endsWith('/');
          const name = item.replace('/', '');
          const perm = isDir ? 'drwxr-xr-x' : (item.endsWith('.sh') || item.endsWith('.py') ? '-rwxr-xr-x' : '-rw-r--r--');
          const colorClass = isDir ? 'info' : (item.endsWith('.sh') || item.endsWith('.py') ? 'success' : 'warning');
          output += `${perm} 1 devtint devtint ${Math.floor(Math.random() * 9000 + 1000)} Feb ${Math.floor(Math.random() * 20 + 1)} ${Math.floor(Math.random() * 24)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')} <span class="${colorClass}">${isDir ? name + '/' : name}</span>\n`;
        });
        return output.trim();
      }
      
      return dir.filter(item => showAll || !item.startsWith('.')).map(item => {
        const isDir = item.endsWith('/');
        const name = item.replace('/', '');
        const colorClass = isDir ? 'info' : (item.endsWith('.sh') || item.endsWith('.py') ? 'success' : '');
        return colorClass ? `<span class="${colorClass}">${isDir ? name + '/' : name}</span>` : name;
      }).join('  ');
    },
    
    'ls -la': (args) => commands.ls('-la'),
    'ls -l': (args) => commands.ls('-l'),
    'ls -a': (args) => commands.ls('-a'),
    
    tree: () => `<span class="info">.</span>
├── <span class="info">projects/</span>
│   ├── NUCLEI_CNM/
│   ├── SecurityHeaderScanner/
│   └── Js-And-Endpoints-scanner/
├── <span class="info">tools/</span>
│   ├── nuclei/
│   ├── burp/
│   └── custom-scripts/
├── <span class="info">scripts/</span>
│   ├── recon-auto.sh
│   └── subdomain-enum.py
├── <span class="success">recon.sh</span>
├── <span class="success">scan.py</span>
├── targets.txt
└── notes.md

<span class="info">6 directories, 8 files</span>`,
    
    find: (args) => {
      if (!args) return '<span class="error">find: missing argument</span>';
      const results = [];
      Object.keys(filesystem).forEach(path => {
        filesystem[path].forEach(item => {
          if (item.toLowerCase().includes(args.toLowerCase())) {
            results.push(path + '/' + item.replace('/', ''));
          }
        });
      });
      Object.keys(fileContents).forEach(file => {
        if (file.toLowerCase().includes(args.toLowerCase())) {
          results.push('/home/devtint/' + file);
        }
      });
      if (results.length === 0) return `<span class="warning">No files found matching "${args}"</span>`;
      return results.join('\n');
    },
    
    head: (args) => {
      if (!args) return '<span class="error">head: missing file operand</span>';
      const content = fileContents[args];
      if (content) {
        return content.split('\n').slice(0, 10).join('\n');
      }
      return `<span class="error">head: ${args}: No such file</span>`;
    },
    
    cat: (args) => {
      if (!args) return '<span class="error">cat: missing file operand</span>';
      // Check direct content
      if (fileContents[args]) {
        return `<pre>${fileContents[args]}</pre>`;
      }
      // Check path-based content
      const filename = args.startsWith('/') ? args : args;
      if (fileContents[filename]) {
        return `<pre>${fileContents[filename]}</pre>`;
      }
      return `<span class="error">cat: ${args}: No such file or directory</span>`;
    },
    
    // Resource monitoring
    'df -h': () => `Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1       256G   47G  196G  20% /
tmpfs            16G     0   16G   0% /dev/shm
/dev/sda2       512G  234G  278G  46% /home
/dev/sdb1       1.0T  567G  433G  57% /data`,
    
    df: () => commands['df -h'](),
    
    'free -h': () => `              total        used        free      shared  buff/cache   available
Mem:           31Gi       8.2Gi       14Gi       512Mi       8.8Gi        22Gi
Swap:          8.0Gi          0B       8.0Gi`,
    
    free: () => commands['free -h'](),
    
    'ps aux': () => `USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root         1  0.0  0.0 169432 13212 ?        Ss   Feb17   0:07 /sbin/init
devtint   1234  0.5  0.2 421532 82340 ?        Ssl  14:00   0:12 /usr/bin/alacritty
devtint   1456  0.0  0.0  12456  5632 pts/0    Ss   14:00   0:00 /bin/zsh
devtint   2345  2.1  1.2 1284532 402340 ?      Sl   14:05   0:45 /usr/bin/code
devtint   3456  0.8  0.5 845632 162340 ?       Sl   14:10   0:22 /usr/java/burpsuite_pro.jar
devtint   4567  0.1  0.1  45632  32340 pts/1   S+   14:15   0:03 python3 scan.py`,
    
    ps: () => commands['ps aux'](),
    
    top: () => `<span class="info">top - ${new Date().toLocaleTimeString()} up 3 days, 7:42, 2 users, load average: 0.52, 0.58, 0.59</span>
Tasks: 247 total,   1 running, 246 sleeping,   0 stopped,   0 zombie
%Cpu(s):  8.2 us,  2.1 sy,  0.0 ni, 88.4 id,  0.8 wa,  0.0 hi,  0.5 si
MiB Mem :  32168.4 total,  14523.2 free,   8432.1 used,   9213.1 buff/cache
MiB Swap:   8192.0 total,   8192.0 free,      0.0 used.  22156.3 avail Mem

  <span class="warning">PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND</span>
 2345 devtint   20   0 1284532 402340  82340 S   2.1   1.2   0:45.32 code
 3456 devtint   20   0  845632 162340  45632 S   0.8   0.5   0:22.15 burpsuite
 1234 devtint   20   0  421532  82340  32456 S   0.5   0.2   0:12.87 alacritty`,
    
    htop: () => `<span class="warning">htop not available in this demo. Try 'top'</span>`,
    
    env: () => `USER=devtint
HOME=/home/devtint
SHELL=/bin/zsh
TERM=xterm-256color
PATH=/home/devtint/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
LANG=en_US.UTF-8
EDITOR=nvim
VISUAL=code
XDG_SESSION_TYPE=x11
DISPLAY=:0
GO111MODULE=on
GOPATH=/home/devtint/go
PYTHONDONTWRITEBYTECODE=1`,
    
    echo: (args) => args || '',
    
    history: () => commandHistory.length > 0 
      ? commandHistory.map((cmd, i) => `  ${commandHistory.length - i}  ${cmd}`).reverse().join('\n')
      : '<span class="info">No commands in history yet</span>',

    // Neofetch
    neofetch: () => `<span class="info">      ,.....                    </span>  <span class="success">devtint</span>@<span class="success">kali</span>
<span class="info">  .,;:;;;;;;;;:;,.              </span>  ──────────────────
<span class="info">.;;;;;;;;;;;;;;;;;,.            </span>  <span class="info">OS:</span> Kali Linux
<span class="info">;;;;;;;;,'  \`;;;;;;;;;          </span>  <span class="info">Host:</span> ThinkPad X1
<span class="info">;;;;;;'        \`;;;;;;;         </span>  <span class="info">Kernel:</span> 6.1.0-kali9-amd64
<span class="info">;;;;;            ;;;;;;         </span>  <span class="info">Shell:</span> zsh 5.9
<span class="info">;;;;              ;;;;;         </span>  <span class="info">Terminal:</span> alacritty
<span class="info">;;;;              ;;;;;         </span>  <span class="info">Editor:</span> nvim / vscode
<span class="info">;;;;;            ;;;;;;         </span>  <span class="info">Languages:</span> Python, TS, JS
<span class="info">;;;;;;          ;;;;;;'         </span>  <span class="info">Focus:</span> Security / Pentest
<span class="info">\`;;;;;;;;;;;;;;;;;;;;;          </span>  
<span class="info">  ';;;;;;;;;;;;;;;;;;           </span>  <span class="error">███</span><span class="success">███</span><span class="warning">███</span><span class="info">███</span>`,

    // Security tools
    nmap: (args) => `<span class="info">Starting Nmap 7.94 ( https://nmap.org )</span>
Nmap scan report for ${args || 'target.com'} (93.184.216.34)
Host is up (0.042s latency).

PORT     STATE  SERVICE    VERSION
<span class="success">22/tcp   open</span>   ssh        OpenSSH 8.9p1
<span class="success">80/tcp   open</span>   http       nginx 1.18.0
<span class="success">443/tcp  open</span>   ssl/http   nginx 1.18.0
<span class="warning">3306/tcp filtered</span> mysql
<span class="success">8080/tcp open</span>   http-proxy Apache Tomcat 9.0.65

Service detection performed. Nmap done.`,

    nuclei: () => `<span class="info">
                     __     _
   ____  __  _______/ /__  (_)
  / __ \\/ / / / ___/ / _ \\/ /
 / / / / /_/ / /__/ /  __/ /
/_/ /_/\\__,_/\\___/_/\\___/_/   v3.1.0</span>

[INF] Loading templates...
[INF] Using 2847 templates

<span class="error">[critical]</span> [CVE-2023-44487] [http] https://target.com/api
<span class="warning">[high]</span> [exposed-panels:phpmyadmin] https://target.com/phpmyadmin
<span class="warning">[high]</span> [misconfig:cors-misconfiguration] https://api.target.com
<span class="highlight">[medium]</span> [tech-detect:nginx] https://target.com
<span class="info">[info]</span> [http-missing-security-headers] https://target.com

[INF] Found 5 results in 18.2s`,

    subfinder: () => `<span class="info">
        _     __ _         _         
  _____| |__ / _(_)_ _  __| |___ _ _ 
 (_-< || '_ \\  _| | ' \\/ _\` / -_) '_|
 /__/\\_,_.__/_| |_|_||_\\__,_\\___|_| v2.6.3</span>

[INF] Enumerating subdomains for target.com

<span class="success">api.target.com</span>
<span class="success">dev.target.com</span>
<span class="success">staging.target.com</span>
<span class="success">admin.target.com</span>
<span class="success">mail.target.com</span>
<span class="success">cdn.target.com</span>
<span class="success">blog.target.com</span>
<span class="warning">internal.target.com</span>
<span class="warning">test.target.com</span>

[INF] Found 47 subdomains for target.com in 4.2s`,

    httpx: () => `<span class="info">
    __    __  __       _  __
   / /_  / /_/ /_____ | |/ /
  / __ \\/ __/ __/ __ \\|   / 
 / / / / /_/ /_/ /_/ /   |  
/_/ /_/\\__/\\__/ .___/_/|_|  v1.3.7
             /_/</span>

<span class="success">[200]</span> https://api.target.com [nginx]
<span class="success">[200]</span> https://dev.target.com [Apache]
<span class="warning">[403]</span> https://admin.target.com [nginx]
<span class="info">[301]</span> https://mail.target.com → https://mail.google.com
<span class="success">[200]</span> https://cdn.target.com [CloudFlare]

Processed 47 hosts in 6.8s`,

    ffuf: () => `<span class="info">
        /'___\\  /'___\\           /'___\\   
       /\\ \\__/ /\\ \\__/  __  __  /\\ \\__/   
       \\ \\ ,__\\\\ \\ ,__\\/\\ \\/\\ \\ \\ \\ ,__\\  
        \\ \\ \\_/ \\ \\ \\_/\\ \\ \\_\\ \\ \\ \\ \\_/  
         \\ \\_\\   \\ \\_\\  \\ \\____/  \\ \\_\\   
          \\/_/    \\/_/   \\/___/    \\/_/   v2.1.0</span>

[Status: <span class="success">200</span>, Size: 1523] <span class="success">admin</span>
[Status: <span class="success">200</span>, Size: 892]  <span class="success">api</span>
[Status: <span class="success">200</span>, Size: 445]  <span class="warning">backup</span>
[Status: <span class="success">200</span>, Size: 234]  <span class="error">config.bak</span> ← sensitive!
[Status: <span class="info">301</span>, Size: 178]  uploads
[Status: <span class="warning">403</span>, Size: 162]  .git
[Status: <span class="success">200</span>, Size: 12840] debug.log

:: Progress: [4614/4614] :: 245 req/sec :: Errors: 0 ::`,

    burp: () => `<span class="info">Burp Suite Professional v2024.1</span>

Favorite features:
• Repeater - Manual request manipulation
• Intruder - Automated attacks
• Scanner - Vulnerability detection
• Collaborator - OOB testing

Current project: Web app pentest
Requests captured: 2,847
Issues found: 12`,

    sqlmap: () => `<span class="info">
        ___
       __H__
 ___ ___[.]_____ ___ ___  {1.7.12}
|_ -| . [']     | .'| . |
|___|_  ["]_|_|_|__,|  _|
      |_|V...       |_|</span>

[*] testing connection to target URL
[*] checking if target is protected by WAF/IPS
<span class="success">[+] target is not protected by WAF</span>
[*] testing for SQL injection
<span class="error">[!] parameter 'id' appears vulnerable</span>
<span class="success">[+] Type: boolean-based blind</span>
<span class="success">[+] Type: time-based blind</span>
<span class="success">[+] Type: UNION query</span>

[*] fetching database names
<span class="warning">[+] available databases [3]:</span>
    - information_schema
    - mysql  
    - webapp_prod`,

    // More security tools
    gobuster: () => `<span class="info">===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================</span>
[+] Url:                     https://target.com
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/wordlists/dirb/common.txt
===============================================================
Starting gobuster
===============================================================
<span class="success">/admin</span>                (Status: 200) [Size: 1234]
<span class="success">/api</span>                  (Status: 301) [Size: 178]
<span class="warning">/backup</span>               (Status: 403) [Size: 162]
<span class="error">/config.php.bak</span>       (Status: 200) [Size: 892]
<span class="success">/login</span>                (Status: 200) [Size: 2341]
<span class="success">/uploads</span>              (Status: 301) [Size: 178]
===============================================================
Finished`,
    
    dirsearch: () => `<span class="info">
  _|. _ _  _  _  _ _|_    v0.4.3
 (_||| _) (/_(_|| (_| )</span>

Extensions: php, aspx, jsp, html, js | HTTP method: GET
Threads: 25 | Wordlist size: 10927

Target: https://target.com

<span class="success">[200]</span>    4KB  /admin/login.php
<span class="success">[200]</span>   12KB  /api/v1/users  
<span class="warning">[403]</span>  287B   /.git/
<span class="warning">[403]</span>  287B   /.env
<span class="error">[200]</span>    2KB  /backup.sql.gz
<span class="success">[301]</span>  178B   /uploads -> /uploads/

Task Completed`,

    nikto: () => `<span class="info">- Nikto v2.5.0
---------------------------------------------------------------------------</span>
+ Target IP:          93.184.216.34
+ Target Hostname:    target.com
+ Target Port:        443
---------------------------------------------------------------------------
+ SSL Info:           Subject:  /CN=target.com
                      Ciphers:  TLS_AES_256_GCM_SHA384
+ Start Time:         2026-02-20 14:32:07 (GMT7)
---------------------------------------------------------------------------
+ Server: nginx/1.18.0
<span class="warning">+ /admin/: Admin login page found</span>
<span class="error">+ /backup/: Backup directory found</span>
<span class="error">+ /phpinfo.php: PHP info file found</span>
<span class="warning">+ X-Frame-Options header missing</span>
<span class="warning">+ X-Content-Type-Options header missing</span>
+ 7915 requests: 0 errors, 12 items found
---------------------------------------------------------------------------
+ End Time:           2026-02-20 14:35:42 (3 min 35 sec)`,

    wpscan: () => `<span class="info">_______________________________________________________________
         __          _______   _____
         \\ \\        / /  __ \\ / ____|
          \\ \\  /\\  / /| |__) | (___   ___  __ _ _ __ ®
           \\ \\/  \\/ / |  ___/ \\___ \\ / __|/ _\` | '_ \\
            \\  /\\  /  | |     ____) | (__| (_| | | | |
             \\/  \\/   |_|    |_____/ \\___|\\__,_|_| |_|

         WordPress Security Scanner by the WPScan Team</span>

[+] URL: https://target.com/
[+] Effective URL: https://target.com/

[+] WordPress version <span class="success">6.4.2</span> identified
<span class="warning">[!] 3 vulnerabilities identified:</span>

<span class="error">[!] Title: WP < 6.4.3 - Admin+ PHP Deserialization</span>
    Fixed in: 6.4.3
    Reference: https://wpscan.com/vulnerability/xxx

<span class="warning">[+] WordPress theme: flavor
[+] Version: 1.8.2 (outdated)</span>

[+] Enumerating users...
[+] Identified Users:
    - admin (ID: 1)
    - editor (ID: 2)`,

    whatweb: () => `<span class="info">https://target.com [200 OK]</span>
  Country[US], HTTPServer[nginx/1.18.0], IP[93.184.216.34],
  JQuery[3.6.0], Meta-Author[Target Corp], MetaGenerator[WordPress 6.4.2],
  PHP[8.2.0], Script, Title[Target - Home], UncommonHeaders[x-powered-by],
  WordPress[6.4.2], X-Frame-Options[SAMEORIGIN]`,

    waybackurls: () => `<span class="info">[INF] Fetching URLs from Wayback Machine...</span>

https://target.com/admin/login
https://target.com/api/v1/users
https://target.com/api/v1/auth
<span class="warning">https://target.com/backup/db.sql</span>
<span class="warning">https://target.com/config.php.bak</span>
https://target.com/.git/config
https://target.com/wp-admin/
https://target.com/uploads/2023/
<span class="error">https://target.com/api/internal/debug</span>

[INF] Found 247 unique URLs`,

    gau: () => `<span class="info">GAU - Get All URLs v2.2.3</span>

[+] Fetching from AlienVault OTX...
[+] Fetching from Wayback Machine...
[+] Fetching from Common Crawl...
[+] Fetching from URLScan...

https://target.com/
https://target.com/about
https://target.com/api/
https://target.com/api/v1/status
<span class="warning">https://target.com/api/internal/</span>
<span class="warning">https://target.com/backup/</span>
https://target.com/login
https://target.com/register

[+] Found 892 unique URLs in 4.2s`,

    paramspider: () => `<span class="info">
 ____                            ____        _     _           
|  _ \\ __ _ _ __ __ _ _ __ ___  / ___| _ __ (_) __| | ___ _ __ 
| |_) / _\` | '__/ _\` | '_ \` _ \\ \\___ \\| '_ \\| |/ _\` |/ _ \\ '__|
|  __/ (_| | | | (_| | | | | | | ___) | |_) | | (_| |  __/ |   
|_|   \\__,_|_|  \\__,_|_| |_| |_||____/| .__/|_|\\__,_|\\___|_|   
                                      |_|</span>

[+] Mining URLs from target.com...

<span class="success">[PARAM]</span> https://target.com/search?q=FUZZ
<span class="success">[PARAM]</span> https://target.com/user?id=FUZZ
<span class="warning">[PARAM]</span> https://target.com/api/user?id=FUZZ&admin=FUZZ
<span class="error">[PARAM]</span> https://target.com/redirect?url=FUZZ
<span class="error">[PARAM]</span> https://target.com/download?file=FUZZ

[+] Found 34 unique parameters`,

    dalfox: () => `<span class="info">
    _____         .__   _____             
   /  _  \\ _____  |  |_/ ____\\____  ___  __
  /  /_\\  \\\\__  \\ |  |\\   __\\/  _ \\ \\  \\/  /
 /    |    \\/ __ \\|  |_|  | (  <_> ) >    < 
 \\____|__  (____  /____/__|  \\____/ /__/\\_ \\
         \\/     \\/                        \\/  v2.9.2</span>

[*] Testing target.com for XSS...

<span class="error">[POC] [G] [REFLECTED]</span> https://target.com/search?q=%22%3E%3Cscript%3Ealert(1)%3C/script%3E
<span class="error">[POC] [R] [DOM-BASED]</span> https://target.com/page#<img/src=x onerror=alert(1)>
<span class="warning">[WEAK] [FILTERED]</span> https://target.com/comment?text= (WAF detected)

[+] Found 2 XSS vulnerabilities, 1 potential`,

    secretfinder: () => `<span class="info">SecretFinder - JS Secrets Finder v1.1</span>

[+] Analyzing JS files...
[+] Found: app.js (245KB)
[+] Found: vendor.js (892KB)
[+] Found: config.js (12KB)

<span class="error">[!] AWS Access Key:</span> AKIAIOSFODNN7EXAMPLE
<span class="error">[!] API Key:</span> sk_live_1234567890abcdef
<span class="warning">[!] Google Maps API:</span> AIzaSyA...
<span class="warning">[!] Slack Webhook:</span> https://hooks.slack.com/services/...
<span class="success">[+] Internal API:</span> /api/internal/v2/admin

[+] Found 5 secrets in 3 files`,

    linkfinder: () => `<span class="info">LinkFinder v1.5 - JS Endpoint Finder</span>

[+] Extracting endpoints from JS files...

<span class="info">/api/v1/users</span>
<span class="info">/api/v1/auth/login</span>
<span class="info">/api/v1/auth/logout</span>
<span class="info">/api/v1/profile</span>
<span class="warning">/api/v2/admin/users</span>
<span class="warning">/api/v2/admin/settings</span>
<span class="error">/api/internal/debug</span>
<span class="error">/api/internal/metrics</span>

[+] Found 23 unique endpoints`,

    // Network commands
    ping: (args) => {
      const host = args || '8.8.8.8';
      return `PING ${host} (${host === 'google.com' ? '142.250.180.46' : '8.8.8.8'}) 56(84) bytes of data.
64 bytes from ${host}: icmp_seq=1 ttl=117 time=12.4 ms
64 bytes from ${host}: icmp_seq=2 ttl=117 time=11.8 ms
64 bytes from ${host}: icmp_seq=3 ttl=117 time=12.1 ms
64 bytes from ${host}: icmp_seq=4 ttl=117 time=11.9 ms

--- ${host} ping statistics ---
4 packets transmitted, 4 received, <span class="success">0% packet loss</span>, time 3004ms
rtt min/avg/max/mdev = 11.8/12.05/12.4/0.23 ms`;
    },
    
    curl: (args) => {
      if (!args) return '<span class="error">curl: try \'curl --help\' for more information</span>';
      return `<span class="info">HTTP/2 200 OK
server: nginx/1.18.0
content-type: text/html; charset=utf-8
x-frame-options: SAMEORIGIN
strict-transport-security: max-age=31536000

<!DOCTYPE html>
<html>
  <head><title>${args}</title></head>
  <body>...</body>
</html></span>`;
    },
    
    wget: (args) => {
      if (!args) return '<span class="error">wget: missing URL</span>';
      return `--2026-02-20 14:32:07--  ${args}
Resolving ${args.replace('https://', '').replace('http://', '').split('/')[0]}...
Connecting to ${args}... connected.
HTTP request sent, awaiting response... <span class="success">200 OK</span>
Length: 12847 (12K) [text/html]
Saving to: 'index.html'

index.html          100%[===================>]  12.55K  --.-KB/s    in 0.02s

<span class="success">2026-02-20 14:32:07 (627 KB/s) - 'index.html' saved [12847/12847]</span>`;
    },
    
    dig: (args) => {
      const domain = args || 'target.com';
      return `<span class="info">; <<>> DiG 9.18.24 <<>> ${domain}</span>
;; QUESTION SECTION:
;${domain}.                    IN      A

;; ANSWER SECTION:
${domain}.             300     IN      A       93.184.216.34

;; Query time: 24 msec
;; SERVER: 8.8.8.8#53(8.8.8.8)`;
    },
    
    whois: (args) => {
      if (!args) return '<span class="error">whois: missing domain</span>';
      return `<span class="info">Domain Name: ${args.toUpperCase()}</span>
Registry Domain ID: 123456789_DOMAIN
Registrar: GoDaddy.com, LLC
Updated Date: 2025-01-15T09:00:00Z
Creation Date: 2015-03-20T12:00:00Z
Registrar Registration Expiration Date: 2027-03-20
Registrar: GoDaddy.com, LLC
Domain Status: clientTransferProhibited
Registry Registrant ID: REDACTED
Registrant Name: REDACTED FOR PRIVACY`;
    },
    
    traceroute: (args) => `traceroute to ${args || 'target.com'} (93.184.216.34), 30 hops max
 1  gateway (192.168.1.1)  1.234 ms
 2  10.0.0.1  5.678 ms
 3  isp-router.net (203.0.113.1)  12.345 ms
 4  core-router.isp.net (198.51.100.1)  18.901 ms
 5  edge.cdn.net (93.184.216.1)  24.567 ms
 6  <span class="success">target.com (93.184.216.34)  28.123 ms</span>`,
    
    netstat: () => `Active Internet connections (servers and established)
Proto Recv-Q Send-Q Local Address           Foreign Address         State
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN
tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN
tcp        0      0 0.0.0.0:443             0.0.0.0:*               LISTEN
tcp        0      0 127.0.0.1:8080          0.0.0.0:*               LISTEN
tcp        0    312 192.168.1.100:43256     93.184.216.34:443       ESTABLISHED
tcp        0      0 192.168.1.100:35892     140.82.121.4:443        ESTABLISHED`,
    
    'ss -tuln': () => `Netid    State     Recv-Q    Send-Q    Local Address:Port    Peer Address:Port
tcp      LISTEN    0         128       0.0.0.0:22             0.0.0.0:*
tcp      LISTEN    0         128       0.0.0.0:80             0.0.0.0:*
tcp      LISTEN    0         128       0.0.0.0:443            0.0.0.0:*
tcp      LISTEN    0         128       127.0.0.1:8080         0.0.0.0:*
tcp      LISTEN    0         128       127.0.0.1:3306         0.0.0.0:*`,
    
    ss: () => commands['ss -tuln'](),
    
    ifconfig: () => `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.1.100  netmask 255.255.255.0  broadcast 192.168.1.255
        inet6 fe80::1  prefixlen 64  scopeid 0x20<link>
        ether 00:11:22:33:44:55  txqueuelen 1000  (Ethernet)
        RX packets 847234  bytes 892345678 (851.0 MiB)
        TX packets 234567  bytes 123456789 (117.7 MiB)

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>`,
    
    'ip addr': () => `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536
    inet 127.0.0.1/8 scope host lo
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500
    inet <span class="success">192.168.1.100/24</span> brd 192.168.1.255 scope global eth0`,

    // CTF utilities
    base64: (args) => {
      if (!args) return '<span class="error">base64: missing operand</span>';
      if (args.startsWith('-d ')) {
        const encoded = args.replace('-d ', '');
        try {
          return `<span class="success">${atob(encoded)}</span>`;
        } catch {
          return '<span class="error">base64: invalid input</span>';
        }
      }
      return `<span class="success">${btoa(args)}</span>`;
    },
    
    md5sum: (args) => {
      if (!args) return '<span class="error">md5sum: missing operand</span>';
      // Simple hash simulation
      const hash = Array.from(args).reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
      return `<span class="success">${Math.abs(hash).toString(16).padStart(32, '0')}</span>  -`;
    },
    
    sha256sum: (args) => {
      if (!args) return '<span class="error">sha256sum: missing operand</span>';
      const hash = Array.from(args).reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
      return `<span class="success">${Math.abs(hash).toString(16).padStart(64, 'a')}</span>  -`;
    },
    
    rot13: (args) => {
      if (!args) return '<span class="error">rot13: missing text</span>';
      return args.replace(/[a-zA-Z]/g, c => String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26));
    },
    
    hex: (args) => {
      if (!args) return '<span class="error">hex: missing text</span>';
      return Array.from(args).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
    },
    
    unhex: (args) => {
      if (!args) return '<span class="error">unhex: missing hex</span>';
      try {
        return args.split(' ').filter(h => h).map(h => String.fromCharCode(parseInt(h, 16))).join('');
      } catch {
        return '<span class="error">unhex: invalid hex</span>';
      }
    },
    
    strings: () => `ELF
/lib64/ld-linux-x86-64.so.2
libc.so.6
__stack_chk_fail
printf
<span class="warning">PASSWORD=s3cr3t_k3y</span>
<span class="warning">API_KEY=sk_live_xxxxx</span>
<span class="success">/home/devtint</span>
DEBUG_MODE=true
GCC: (Ubuntu 11.4.0-1ubuntu1)`,

    xxd: () => `00000000: 4845 4c4c 4f20 574f 524c 4421 0a         HELLO WORLD!.
0000000d: 5468 6973 2069 7320 6120 7365 6372 6574  This is a secret
0000001d: 206d 6573 7361 6765 2e0a                  message..`,
    
    binwalk: () => `<span class="info">DECIMAL       HEXADECIMAL     DESCRIPTION
--------------------------------------------------------------------------------</span>
0             0x0             ELF, 64-bit LSB executable
8192          0x2000          Zlib compressed data
16384         0x4000          <span class="warning">PNG image, 800 x 600</span>
32768         0x8000          <span class="error">Hidden ZIP archive</span>
65536         0x10000         <span class="error">Encrypted data (AES-256)</span>`,

    hashcat: () => `<span class="info">hashcat (v6.2.6) starting...</span>

* Device #1: NVIDIA GeForce RTX 4090, 24GB
* Attack-mode: Brute-force (mask)

<span class="success">[STATUS] Cracked: 1/1 (100%)</span>
<span class="success">e99a18c428cb38d5f260853678922e03:abc123</span>

Session..........: hashcat
Status...........: Cracked
Hash.Type........: MD5
Speed.#1.........: 58247.3 MH/s
Time.Started.....: Thu Feb 20 14:32:07 2026`,

    john: () => `<span class="info">John the Ripper 1.9.0-jumbo-1</span>

Using default input encoding: UTF-8
Loaded 1 password hash (Raw-MD5)
Press 'q' or Ctrl-C to abort...

<span class="success">password123</span>      (admin)
1g 0:00:00:02 DONE 0.5000g/s 12345Kp/s

Session completed`,

    'python3 --version': () => '<span class="success">Python 3.11.2</span>',
    'python --version': () => '<span class="success">Python 3.11.2</span>',
    
    'node --version': () => '<span class="success">v20.10.0</span>',
    'node -v': () => '<span class="success">v20.10.0</span>',
    
    'npm --version': () => '<span class="success">10.2.4</span>',
    
    'git status': () => `On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  <span class="error">modified:   src/scanner.py</span>
  <span class="error">modified:   config.yaml</span>

Untracked files:
  <span class="warning">output/</span>
  <span class="warning">temp.log</span>

no changes added to commit`,

    'git log': () => `<span class="warning">commit a1b2c3d</span> (HEAD -> main, origin/main)
Author: devtint <devtint@users.noreply.github.com>
Date:   Thu Feb 20 14:30:00 2026 +0700

    feat: add security header scanner

<span class="warning">commit e4f5g6h</span>
Author: devtint <devtint@users.noreply.github.com>
Date:   Wed Feb 19 11:15:00 2026 +0700

    fix: nuclei template parsing`,

    'npm run build': () => `<span class="info">> project@1.0.0 build</span>
<span class="info">> tsc && vite build</span>

vite v5.0.12 building for production...
✓ 847 modules transformed.
<span class="success">dist/index.html         1.23 kB</span>
<span class="success">dist/assets/index.js    142.56 kB</span>
<span class="success">dist/assets/style.css   8.92 kB</span>

<span class="success">✓ built in 2.4s</span>`,

    'pip list': () => `Package         Version
--------------- -------
requests        2.31.0
beautifulsoup4  4.12.2
httpx           0.25.2
pycryptodome    3.19.0
click           8.1.7
rich            13.7.0
nuclei-python   0.1.8`,

    about: () => `<span class="info">┌─────────────────────────────────────────┐
│             About devtint               │
├─────────────────────────────────────────┤</span>
│ Name: Tint Naing Win                    │
│ Handle: devtint                         │
│ Location: Bangkok, Thailand             │
│ Education: Kasem Bundit University      │
│                                         │
│ <span class="success">Focus:</span> Security / Penetration Testing  │
│ <span class="success">Interests:</span> Vuln research, Automation   │
│ <span class="success">Daily driver:</span> Kali Linux               │
<span class="info">└─────────────────────────────────────────┘</span>`,

    skills: () => `<span class="highlight">Languages:</span>
  ● Python      ████████████████░░░░  80%
  ● TypeScript  ██████████████░░░░░░  70%
  ● JavaScript  ██████████████░░░░░░  70%
  ● Bash        ████████████░░░░░░░░  60%

<span class="highlight">Security:</span>
  ● Web App Testing    ████████████████░░░░  80%
  ● API Security       ██████████████░░░░░░  70%
  ● Vuln Research      ████████████░░░░░░░░  60%
  ● Automation         ████████████████░░░░  80%

<span class="highlight">Tools:</span>
  Burp Suite, Nuclei, Nmap, ffuf, SQLMap
  Git, Docker, VS Code, Vim`,

    projects: () => `<span class="info">Featured Projects:</span>

<span class="success">1. NUCLEI_CNM</span> [TypeScript]
   Nuclei command center & helpers
   <span class="highlight">→ github.com/devtint/NUCLEI_CNM</span>

<span class="success">2. SecurityHeaderScanner</span> [Python]
   HTTP security header analysis tool
   <span class="highlight">→ github.com/devtint/SecurityHeaderScanner</span>

<span class="success">3. GeminiSheeridVerify</span> [Python]
   Verification & integration tooling
   <span class="highlight">→ github.com/devtint/GeminiSheeridVerify</span>

<span class="success">4. Js-And-Endpoints-scanner</span> [JavaScript]
   JS file & endpoint extraction
   <span class="highlight">→ github.com/devtint/Js-And-Endpoints-scanner</span>

<span class="success">5. r3verse_shells_gen</span> [JavaScript]
   Reverse shell generator
   <span class="highlight">→ github.com/devtint/r3verse_shells_gen</span>`,

    contact: () => `<span class="info">Get in touch:</span>

  <span class="success">GitHub:</span>    github.com/devtint
  <span class="success">Telegram:</span>  t.me/BadCodeWriter
  <span class="success">Portfolio:</span> tintnaingwin.vercel.app
  <span class="success">ORCID:</span>     orcid.org/0009-0007-0176-2022`,

    socials: () => `<span class="info">Social Links:</span>

  <span class="highlight">[GH]</span>  github.com/devtint
  <span class="highlight">[TG]</span>  t.me/BadCodeWriter
  <span class="highlight">[WEB]</span> tintnaingwin.vercel.app`,

    resume: () => `<span class="warning">Resume download not implemented yet!</span>
Contact me via Telegram: <span class="info">t.me/BadCodeWriter</span>`,

    // More about commands
    certifications: () => `<span class="info">Certifications & Learning:</span>

  <span class="success">●</span> TryHackMe - Top 1% Global
  <span class="success">●</span> HackTheBox - Pro Hacker
  <span class="success">●</span> PortSwigger Web Security Academy
  <span class="success">●</span> Offensive Security (studying)

<span class="highlight">Bug Bounty:</span>
  Active on HackerOne & Bugcrowd
  Focus: Web apps, APIs, Auth bypass`,

    experience: () => `<span class="info">Experience:</span>

<span class="success">● Security Researcher</span> <span class="warning">(Current)</span>
  Independent bug bounty hunter
  Web application security testing
  Vulnerability research & automation

<span class="success">● CTF Player</span>
  Web exploitation challenges
  Binary analysis & reverse engineering
  Cryptography puzzles

<span class="success">● Open Source Contributor</span>
  Security tools development
  Nuclei templates
  Custom scanners & scripts`,

    education: () => `<span class="info">Education:</span>

<span class="success">Kasem Bundit University</span> - Bangkok, Thailand
  Bachelor's in Computer Science
  
<span class="highlight">Self-taught:</span>
  OWASP Top 10
  Web Security Academy
  CTF platforms (THM, HTB)
  Security research papers`,

    // Dev tools
    'git branch': () => `* <span class="success">main</span>
  develop
  feature/scanner
  fix/nuclei-parser`,
    
    'git remote -v': () => `origin  git@github.com:devtint/project.git (fetch)
origin  git@github.com:devtint/project.git (push)`,
    
    'docker ps': () => `CONTAINER ID   IMAGE           COMMAND       STATUS         PORTS                    NAMES
a1b2c3d4e5f6   nginx:latest    "nginx -g"    Up 2 hours     0.0.0.0:80->80/tcp       web
b2c3d4e5f6g7   mysql:8.0       "mysqld"      Up 2 hours     3306/tcp                 db
c3d4e5f6g7h8   redis:alpine    "redis-srv"   Up 2 hours     6379/tcp                 cache`,
    
    'docker images': () => `REPOSITORY          TAG       IMAGE ID       SIZE
nginx               latest    a1b2c3d4e5f6   142MB
mysql               8.0       b2c3d4e5f6g7   545MB
python              3.11      c3d4e5f6g7h8   925MB
kalilinux/kali      latest    d4e5f6g7h8i9   2.1GB
nuclei              latest    e5f6g7h8i9j0   89MB`,
    
    make: () => `<span class="info">make: Entering directory '/home/devtint/projects/scanner'</span>
gcc -O2 -Wall -c src/main.c -o obj/main.o
gcc -O2 -Wall -c src/scanner.c -o obj/scanner.o
gcc -O2 -Wall -c src/parser.c -o obj/parser.o
<span class="success">Linking scanner...</span>
<span class="success">Build complete: ./bin/scanner</span>`,
    
    'gcc --version': () => 'gcc (Debian 12.2.0-14) 12.2.0',
    
    'cargo --version': () => 'cargo 1.75.0 (1d8b05cdd 2023-11-20)',
    
    'go version': () => 'go version go1.21.6 linux/amd64',
    
    'rustc --version': () => 'rustc 1.75.0 (82e1608df 2023-12-21)',

    // Neofetch variants
    screenfetch: () => `<span class="info">         _,met\$\$\$\$\$gg.</span>           <span class="success">devtint</span>@<span class="success">kali</span>
<span class="info">      ,g\$\$\$\$\$\$\$\$\$\$\$\$\$\$\$P.</span>         OS: Kali GNU/Linux Rolling
<span class="info">    ,g\$\$P""       """Y\$\$.".</span>       Kernel: 6.1.0-kali9-amd64
<span class="info">   ,\$\$P'              \`\$\$\$.</span>       Uptime: 3 days, 7 hours
<span class="info">  ',\$\$P       ,ggs.     \`\$\$b:</span>     Packages: 2847
<span class="info">  \`d\$\$'     ,\$P"'   .    \$\$\$</span>      Shell: zsh 5.9
<span class="info">   \$\$P      d\$'     ,    \$\$P</span>      Resolution: 2560x1440
<span class="info">   \$\$:      \$\$.   -    ,d\$\$'</span>      DE: i3wm
<span class="info">   \$\$;      Y\$b._   _,d\$P'</span>        WM: i3
<span class="info">   Y\$\$.    \`.\`"Y\$\$\$\$P"'</span>           Terminal: alacritty
<span class="info">   \`\$\$b      "-.__</span>               CPU: Intel i7-12700H
<span class="info">    \`Y\$\$</span>                          GPU: NVIDIA RTX 3060
<span class="info">     \`Y\$\$.</span>                        Memory: 8432MiB / 31168MiB
<span class="info">       \`\$\$b.</span>
<span class="info">         \`Y\$\$b.</span>                   <span class="error">███</span><span class="success">███</span><span class="warning">███</span><span class="info">███</span><span class="highlight">███</span>`,

    // Fun commands expanded
    fortune: () => {
      const quotes = [
        '"The quieter you become, the more you can hear." - Kali Linux',
        '"Hack the planet!" - Hackers (1995)',
        '"There is no security on this earth, only opportunity." - MacArthur',
        '"The only secure computer is one that\'s unplugged." - Unknown',
        '"With great power comes great responsibility." - Ben Parker',
        '"Try harder." - Offensive Security',
        '"root@world:~# whoami  →  god" - Every hacker\'s dream',
        '"Security is a process, not a product." - Bruce Schneier'
      ];
      return `<span class="info">${quotes[Math.floor(Math.random() * quotes.length)]}</span>`;
    },

    cowsay: (args) => {
      const msg = args || 'Moo!';
      return `<span class="info"> ${'_'.repeat(msg.length + 2)}
< ${msg} >
 ${'-'.repeat(msg.length + 2)}
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||</span>`;
    },

    matrix: () => {
      return `<span class="success">
01001000 01000001 01000011 01001011
╔══════════════════════════════════╗
║ Wake up, Neo...                  ║
║ The Matrix has you...            ║
║ Follow the white rabbit.         ║
║ Knock, knock, Neo.               ║
╚══════════════════════════════════╝
01010100 01001000 01000101 00100000</span>`;
    },

    hack: () => {
      return `<span class="error">
[▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓] 100%

ACCESS GRANTED

╔══════════════════════════════════════╗
║                                      ║
║   ██╗  ██╗ █████╗  ██████╗██╗  ██╗   ║
║   ██║  ██║██╔══██╗██╔════╝██║ ██╔╝   ║
║   ███████║███████║██║     █████╔╝    ║
║   ██╔══██║██╔══██║██║     ██╔═██╗    ║
║   ██║  ██║██║  ██║╚██████╗██║  ██╗   ║
║   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝   ║
║                                      ║
║       SYSTEM COMPROMISED             ║
╚══════════════════════════════════════╝

</span><span class="warning">Just kidding! This is a demo :)</span>`;
    },

    clear: () => 'CLEAR',

    exit: () => '<span class="warning">Nice try! This terminal runs in your browser.</span>',
    
    sudo: () => '<span class="error">[sudo] password for devtint: </span><span class="warning">Nice try! No root for you :)</span>',
    
    rm: () => '<span class="error">rm: Permission denied. This is a demo terminal!</span>',
    
    'rm -rf /': () => '<span class="error">Nice try! This terminal is sandboxed.</span>',
    
    // More fun/easter eggs
    cmatrix: () => `<span class="success">
█▓▒░  ⊰ ⊱ ⌘ ♦ ◊ ⦿  ░▒▓█
╔═══════════════════════════════════╗
║   01001101 01000001 01010100      ║
║   01010010 01001001 01011000      ║
║                                   ║
║   ▓▒░ THE MATRIX AWAITS ░▒▓       ║
║                                   ║
║   Wake up...                      ║
║   Follow the white rabbit...      ║
║                                   ║
║   01010010 01000101 01000001      ║
║   01001100 01001001 01010100      ║
╚═══════════════════════════════════╝
█▓▒░  ⊰ ⊱ ⌘ ♦ ◊ ⦿  ░▒▓█</span>`,

    sl: () => `<span class="warning">
      ====        ________                ___________
  _D _|  |_______/        \\__I_I_____===__|_________|
   |(_)---  |   H\\________/ |   |        =|___ ___|   _________________
   /     |  |   H  |  |     |   |         ||_| |_||   _|                \\_____A
  |      |  |   H  |__--------------------| [___] |   =|                        |
  | ________|___H__/__|_____/[][]~\\_______|       |   -|                        |
  |/ |   |-----------I_____I [][] []  D   |=======|____|________________________|_
__/ =| o |=-~O=====O=====O=====O\\ ____Y___________|__|__________________________|_
 |/-=|___|=    ||    ||    ||    |_____/~\\___/          |_D__D__D_|  |_D__D__D_|
  \\_/      \\__/  \\__/  \\__/  \\__/      \\_/               \\_/   \\_/    \\_/   \\_/

<span class="info">Did you mean 'ls'? :)</span></span>`,

    figlet: (args) => {
      const text = args || 'devtint';
      if (text.toLowerCase() === 'devtint') {
        return `<span class="highlight">
     _            _       _   
  __| | _____   _(_)_ __ | |_ 
 / _\` |/ _ \\ \\ / / | '_ \\| __|
| (_| |  __/\\ V /| | | | | |_ 
 \\__,_|\\___| \\_/ |_|_| |_|\\__|</span>`;
      } else if (text.toLowerCase() === 'hack') {
        return `<span class="error">
 _   _   _    ____ _  __
| | | | / \\  / ___| |/ /
| |_| |/ _ \\| |   | ' / 
|  _  / ___ \\ |___| . \\ 
|_| |_/_/   \\_\\____|_|\\_\\</span>`;
      }
      return `<span class="info">  ${text.toUpperCase()}  </span>`;
    },

    lolcat: (args) => `<span class="error">R</span><span class="warning">a</span><span class="highlight">i</span><span class="success">n</span><span class="info">b</span><span class="error">o</span><span class="warning">w</span> <span class="success">t</span><span class="info">e</span><span class="error">x</span><span class="warning">t</span><span class="success">!</span>
<span class="warning">${args || 'Everything is more fun in rainbow colors!'}</span>`,

    asciiquarium: () => `<span class="info">
                                  \\
                                   \\
                                    \\\\
                                     \\\\
                                      >\\/>
           )\\_______________________/o __/
      ~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~
           ><(((('>   ><(((('>   ><(((('>
      ~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~
             Fish swimming peacefully...
      ~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~</span>`,

    pipes: () => `<span class="success">
┏━┓ ┃ ┏━┛ ┗━┓ ┏━┛ ┗━┓ ┏━┛
┗━┓ ┃ ┃   ┏━┛ ┗━┓ ┏━┛ ┗━┓
┏━┛ ┃ ┗━┓ ┗━┓ ┏━┛ ┗━┓ ┏━┛
┗━┓ ┃ ┏━┛ ┏━┛ ┗━┓ ┏━┛ ┃
  ┃ ┃ ┃   ┃   ┏━┛ ┗━┓ ┃
  ┃ ┃ ┃   ┗━┓ ┗━┓ ┏━┛ ┃

<span class="info">Screensaver mode activated!</span></span>`,

    hollywood: () => `<span class="error">
[CLASSIFIED] OPERATION: CYBER_STORM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<span class="warning">ACCESSING MAINFRAME...</span>
[################] 100%

<span class="warning">DECRYPTING FILES...</span>
[################] 100%

<span class="warning">BYPASSING FIREWALL...</span>
[################] 100%

<span class="success">⚠ ACCESS GRANTED ⚠</span>

TOP SECRET FILES:
- nuclear_codes.txt
- president_emails.db
- alien_evidence.zip

<span class="info">Just like in the movies! 🎬</span>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>`,

    joke: () => {
      const jokes = [
        'Q: Why do programmers prefer dark mode?\nA: Because light attracts bugs! 🐛',
        'Q: How many programmers does it take to change a light bulb?\nA: None. It\'s a hardware problem. 💡',
        'Q: What\'s a hacker\'s favorite season?\nA: Phishing season! 🎣',
        'There are 10 types of people in the world:\nThose who understand binary, and those who don\'t.',
        'Q: Why did the pentester cross the road?\nA: To exploit the other side! 🛣️',
        'Q: What do you call a security vulnerability in a musical instrument?\nA: A guitar string injection! 🎸',
        'A SQL query walks into a bar, walks up to two tables and asks...\n"Can I join you?" 🍺',
        'Q: Why do hackers sleep during the day?\nA: They\'re working the night shift! 🌙',
        'Q: What\'s the object-oriented way to get rich?\nA: Inheritance! 💰',
        'Q: Why was the JavaScript developer sad?\nA: Because he didn\'t Node how to Express himself! 😢'
      ];
      return `<span class="highlight">${jokes[Math.floor(Math.random() * jokes.length)]}</span>`;
    },

    weather: () => {
      const temps = [28, 30, 32, 29, 31];
      const temp = temps[Math.floor(Math.random() * temps.length)];
      return `<span class="info">╔══════════════════════════════════╗
║    Weather for Bangkok, TH       ║
╠══════════════════════════════════╣
║                                  ║
║     ☼  Sunny                     ║
║     Temperature: ${temp}°C / ${Math.round(temp * 9/5 + 32)}°F       ║
║     Humidity: 65%                ║
║     Wind: 12 km/h                ║
║     Perfect weather for hacking! ║
║                                  ║
╚══════════════════════════════════╝</span>`;
    },

    rickroll: () => `<span class="error">
♪♫ Never gonna give you up ♫♪
♪♫ Never gonna let you down ♫♪
♪♫ Never gonna run around and desert you ♫♪
♪♫ Never gonna make you cry ♫♪
♪♫ Never gonna say goodbye ♫♪
♪♫ Never gonna tell a lie and hurt you ♫♪

<span class="warning">You've been rickrolled in a terminal! 🎵</span>
<span class="info">https://www.youtube.com/watch?v=dQw4w9WgXcQ</span></span>`,

    vim: () => `<span class="warning">Entering vim...

<span class="success">~                                                           
~                                           VIM - Vi IMproved
~                                           version 9.0.1499
~                                           by Bram Moolenaar
~
~           Vim is open source and freely distributable
~
~                  Become a registered Vim user!
~                type  :help register  for information
~
~                type  :q         to exit
~                type  :help      for on-line help</span>

<span class="error">How to exit vim:</span>
1. Press ESC
2. Type :q
3. Press Enter
<span class="info">(But seriously, you're stuck in the browser, not vim 😄)</span></span>`,

    emacs: () => `<span class="info">M-x tetris

╔═══════════════════════════════════════╗
║                                       ║
║   GNU Emacs: The extensible,         ║
║   customizable, self-documenting      ║
║   real-time display editor            ║
║                                       ║
║   <span class="warning">Emacs is an operating system,</span>       ║
║   <span class="warning">lacking only a decent text editor</span>   ║
║                                       ║
║   C-x C-c to quit                     ║
║   C-h t   for tutorial                ║
║                                       ║
╚═══════════════════════════════════════╝

<span class="success">The eternal vim vs emacs war continues... ⚔️</span></span>`,

    nano: () => `<span class="success">  GNU nano 7.2              devtint.txt

Welcome to nano, the easy-to-use text editor!

<span class="info">^G Get Help    ^O Write Out   ^W Where Is
^X Exit        ^R Read File   ^K Cut Text</span>

<span class="warning">Fun fact: nano is the only editor where you can
actually figure out how to exit! 😊</span>

^X to exit (Ctrl+X)</span>`,

    // More security tools
    'ssrf-sheriff': () => `<span class="info">
  __________  ____________    _____ __             _ ________
 / ___/ ___\\/ ___/ __/ ___\\  / ___// /  ___  ____(_) __/ __/
 \\__ \\__ \\/ /  / /_  \\__ \\  \\__ \\/ _ \\/ _ \\/ __/ / /_/ /_  
___/ /__/ / /  / __/ ___/ / ___/ /  __/  __/ / / / __/ __/  
/____/____/_/  /_/   /____/ /____/\\___/\\___/_/ /_/_/ /_/     </span>

[+] Testing for SSRF vulnerabilities...

<span class="success">[SAFE]</span> https://target.com/proxy?url=
<span class="warning">[POSSIBLE]</span> https://target.com/fetch?url=http://169.254.169.254
<span class="error">[VULNERABLE]</span> https://target.com/image?src=http://localhost:22

[+] Found 1 SSRF vulnerability
[!] Recommendation: Implement URL whitelist`,
  };

  // Process command
  const processCmd = (cmd) => {
    const trimmed = cmd.trim().toLowerCase();
    const parts = trimmed.split(' ');
    const baseCmd = parts[0];
    const args = parts.slice(1).join(' ');

    // Check exact match first
    if (commands[trimmed]) {
      return typeof commands[trimmed] === 'function' ? commands[trimmed](args) : commands[trimmed];
    }
    
    // Check base command with args
    if (commands[baseCmd]) {
      return typeof commands[baseCmd] === 'function' ? commands[baseCmd](args) : commands[baseCmd];
    }

    // Special handling for cat
    if (baseCmd === 'cat') {
      const file = args || '';
      if (commands['cat ' + file]) {
        return commands['cat ' + file]();
      }
      return `<span class="error">cat: ${file || 'missing operand'}: No such file or directory</span>`;
    }

    // Unknown command
    return `<span class="error">zsh: command not found: ${baseCmd}</span>
<span class="info">Type 'help' for available commands</span>`;
  };

  // Add line to output
  const addLine = (content, isCommand = false, userCmd = '') => {
    const line = document.createElement('div');
    line.className = 'term-line';
    if (isCommand) {
      line.innerHTML = `<span class="prompt">devtint@kali:~$</span> <span class="user-cmd">${userCmd}</span>`;
    } else {
      line.innerHTML = content;
    }
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
  };

  // Handle input
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const cmd = input.value;
      if (!cmd.trim()) return;

      commandHistory.unshift(cmd);
      historyIndex = -1;

      addLine('', true, cmd);

      const result = processCmd(cmd);
      
      if (result === 'CLEAR') {
        output.innerHTML = '';
      } else {
        addLine(result);
      }

      input.value = '';
    }

    // Command history navigation
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        input.value = commandHistory[historyIndex];
      }
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        input.value = commandHistory[historyIndex];
      } else {
        historyIndex = -1;
        input.value = '';
      }
    }

    // Tab completion (basic)
    if (e.key === 'Tab') {
      e.preventDefault();
      const partial = input.value.toLowerCase();
      const matches = Object.keys(commands).filter(c => c.startsWith(partial));
      if (matches.length === 1) {
        input.value = matches[0];
      } else if (matches.length > 1) {
        addLine('', true, partial);
        addLine(`<span class="info">${matches.join('  ')}</span>`);
      }
    }
  });

  // Focus input when clicking terminal
  document.getElementById('interactive-terminal').addEventListener('click', () => {
    input.focus();
  });
});