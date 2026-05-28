/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

console.info("BeplyClockify map script started");

// Relay HTTPS (mismo edge del juego) que reenvía el fichaje al FacturaScripts.
// El navegador no puede llamar al FS http directo (mixed-content); pasa por aquí.
const CLK_RELAY = "https://mundo.services.devbeply.es/clk";
const CLK_TOKEN = "clk-zone-2026-7K9wQ2";
// Zona de fichaje (la creamos por código cubriendo el mapa = "la oficina").
const ZONA = "oficina";

let currentPopup: any = undefined;

function fichar(action: "enter" | "leave"): void {
    const body = new URLSearchParams({
        token: CLK_TOKEN,
        email: WA.player.name || "",
        zona: ZONA,
        action,
    });
    fetch(CLK_RELAY, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        keepalive: true,
        mode: "cors",
    }).catch((e) => console.error("clockify fichar error", e));
}

WA.onInit()
    .then(() => {
        console.info("BeplyClockify ready, player =", WA.player.name);

        // Creamos una zona "oficina" amplia que cubre el mapa: estar conectado
        // al mundo = estar en la oficina (se ficha al entrar, se cierra al salir).
        try {
            WA.room.area.create({
                name: ZONA,
                x: -2000,
                y: -2000,
                width: 8000,
                height: 8000,
            });
        } catch (e) {
            console.info("area create skipped", e);
        }

        WA.room.area.onEnter(ZONA).subscribe(() => {
            currentPopup = WA.ui.openPopup(
                "clockPopup",
                "🟢 Fichaje iniciado (" + (WA.player.name || "?") + ")",
                []
            );
            fichar("enter");
        });

        WA.room.area.onLeave(ZONA).subscribe(() => {
            if (currentPopup !== undefined) {
                currentPopup.close();
                currentPopup = undefined;
            }
            fichar("leave");
        });

        bootstrapExtra()
            .then(() => console.info("Scripting API Extra ready"))
            .catch((e) => console.error(e));
    })
    .catch((e) => console.error(e));

export {};
