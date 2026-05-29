/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

console.info("BeplyClockify map script started");

// Relay HTTPS (mismo origen del juego) que reenvía el fichaje al FacturaScripts.
// Dinámico: funciona en dev (mundo.services.devbeply.es) y prod (mundo.adminbeply.es)
// sin recompilar, porque el script se sirve desde el map-storage del propio dominio.
const CLK_RELAY = window.location.origin + "/clk";
const CLK_TOKEN = "clk-zone-2026-7K9wQ2";
const ZONA = "oficina";
const BTN_ID = "clk-counter";

// Total de hoy (segundos) reportado por el servidor y momento de la última sync.
let baseSeg = 0;
let baseEpoch = Date.now();

function fmt(totalSeg: number): string {
    const h = Math.floor(totalSeg / 3600);
    const m = Math.floor((totalSeg % 3600) / 60);
    return "🕒 " + h + "h " + (m < 10 ? "0" : "") + m + "m";
}

function pintarContador(): void {
    const seg = baseSeg + Math.floor((Date.now() - baseEpoch) / 1000);
    WA.ui.actionBar.addButton({
        id: BTN_ID,
        label: fmt(seg),
        bgColor: "#1f6feb",
        textColor: "#ffffff",
        toolTip: "Horas fichadas hoy",
    } as any);
}

async function fichar(action: "enter" | "leave" | "heartbeat"): Promise<void> {
    const body = new URLSearchParams({
        token: CLK_TOKEN,
        email: WA.player.name || "",
        zona: ZONA,
        action,
    });
    try {
        const res = await fetch(CLK_RELAY, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: body.toString(),
            keepalive: true,
            mode: "cors",
        });
        const data = await res.json();
        if (typeof data.hoyseg === "number") {
            baseSeg = data.hoyseg;
            baseEpoch = Date.now();
            pintarContador();
        }
    } catch (e) {
        console.error("clockify fichar error", e);
    }
}

WA.onInit()
    .then(() => {
        console.info("BeplyClockify ready, player =", WA.player.name);

        // Entrar al mundo = entrar en la oficina -> fichar entrada + mostrar contador.
        fichar("enter");

        // Refresca el contador en pantalla cada 30s (suave) y manda latido cada 60s.
        setInterval(pintarContador, 30000);
        setInterval(() => fichar("heartbeat"), 60000);

        // Salir / cerrar pestaña -> fichar salida (best-effort; el cron de FS respalda).
        const leave = () => { fichar("leave"); };
        window.addEventListener("pagehide", leave);
        window.addEventListener("beforeunload", leave);

        bootstrapExtra()
            .then(() => console.info("Scripting API Extra ready"))
            .catch((e) => console.error(e));
    })
    .catch((e) => console.error(e));

export {};
