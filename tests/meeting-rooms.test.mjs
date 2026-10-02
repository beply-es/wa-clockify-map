import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

function nodes(value) {
    if (!value || typeof value !== 'object') return [];
    return [value, ...Object.values(value).flatMap(nodes)];
}

for (const [file, names] of [
    ['office.tmj', ['jitsiMeetingRoom', 'jitsiChillZone']],
    ['conference.tmj', ['jitsiConference']],
]) {
    test(`${file}: meeting areas allow normal proximity bubbles`, () => {
        const map = JSON.parse(readFileSync(new URL(`../${file}`, import.meta.url)));
        const all = nodes(map);
        for (const name of names) {
            const rooms = all.filter(node => node.name === name);
            assert.equal(rooms.length, 1, `room ${name} must remain in the map`);
            const room = rooms[0];
            assert.equal(room.type, 'area');
            assert.ok(room.width > 0 && room.height > 0);
            assert.ok(!(room.properties || []).some(p => p.name === 'silent' && p.value));
        }
        for (const node of all) {
            assert.ok(!/^jitsi/i.test(node.name || '') || !('value' in node),
                `Jitsi property ${node.name} must not be present`);
        }
    });
}
