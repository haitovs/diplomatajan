# Brute-Force Attack Simulation & Defense

This application visualizes a Brute-Force attack on a server and demonstrates how security measures like Rate Limiting and IP Blocking (WAF) can mitigate it.

## Features

- **Real-time Dashboard**: View total requests, blocked attempts, and failed logins.
- **Traffic Visualization**: Live chart showing Requests Per Second (RPS).
- **Live Logs**: Watch traffic come in with status codes (200 OK, 401 Unauthorized, 429 Too Many Requests).
- **Simulation Control**:
  - **Simulate Attack**: Toggle a brute-force attack simulation.
  - **Attack Intensity**: Adjust the volume of the attack.
  - **Active Defense (WAF)**: Enable/Disable the firewall to see the difference.

## Tech Stack

- **React (Vite)**: Fast and modern frontend.
- **Recharts**: For the traffic chart.
- **Framer Motion**: For smooth animations.
- **Lucide React**: For icons.
- **Vanilla CSS**: Custom glassmorphism design.

## How to Run

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Start the development server:
    ```bash
    npm run dev
    ```
3.  Open [http://localhost:5173](http://localhost:5173) in your browser.

## Server Deployment (Docker)

This project includes the same deployment style as `agabek-crack-with-hashcat`:
- Multi-stage Docker build
- Nginx for static SPA hosting
- Docker Compose for container management

Production settings in this repo:
- Domain: `atajan.raxa2.store`
- Host port: `4050`
- Container port: `80`

### Run on server

```bash
docker compose up -d --build
```

### Check status

```bash
docker compose ps
```

### Open app

`http://YOUR_SERVER_IP:4050`

## How to Use

1.  **Start the App**: You'll see normal background traffic.
2.  **Launch Attack**: Toggle "Simulate Attack" in the Control Panel. Watch the "Failed Logins" and RPS spike.
3.  **Enable Defense**: Toggle "Active Defense (WAF)". Watch as the system starts returning `429` (Rate Limit) and eventually blocks the attacking IPs, reducing the load.
