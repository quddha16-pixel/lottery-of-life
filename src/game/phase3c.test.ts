import { describe, it, expect } from 'vitest';
import { act, advancePaced, createGame, current, interact, routineAction, startLife, respondToEncounter, travel } from './engine';
import { deserialize, serialize } from './storage';
import { eventText, situationText } from './narration';
import { urgentNeed } from './outcomes';

const born = (speciesId: string, seed = `audit-new-${speciesId}`) => startLife(createGame(), {speciesId, seed});
describe('Phase 3C trustworthy care and consequences', () => {
  it('uses milk/provisioning for a thirsty dependent fresh-water animal', () => {
    const s = born('elephant');
    current(s)!.stats.hydration = 25;
    current(s)!.stats.hunger = 10;
    expect(routineAction(s)).toBe('feed');
    expect(situationText(s)).toMatch(/caregiver|milk/);
    const n = act(s, routineAction(s));
    expect(n.area!.animals.find(n=>n.role==='mother')!.bond).toBeGreaterThan(s.area!.animals.find(n=>n.role==='mother')!.bond);
    expect(n.area!.outcome!.changes.length).toBeGreaterThan(0);
    expect(JSON.parse(serialize(deserialize(serialize(n))))).toEqual(JSON.parse(serialize(n)));
  });
  it('replaces an old manual result after an automatic batch and stops at urgent needs', () => {
    let s = born('elephant');
    s = act(s, 'rest'); s = act(s, 'rest'); s = act(s, 'rest'); s = act(s, 'rest');
    s = travel(s, 'water');
    s = interact(s, 'biology:learn-water');
    expect(s.area!.feedback).toMatch(/remember/);
    const next = advancePaced(s);
    expect(next.phases).toBeGreaterThan(0);
    expect(next.state.area!.outcome!.command).toBe('Life unfolds');
    expect(next.state.area!.feedback).not.toBe(s.area!.feedback);
    current(next.state)!.stats.hydration = 20;
    const critical = advancePaced(next.state);
    expect(critical.phases).toBeLessThanOrEqual(16);
    if (urgentNeed(critical.state)) expect(critical.interrupted).toBe(true);
  });
  it('keeps a sampled healthy ant nursery maintained while brood cannot work', () => {
    let s = born('ant');
    for(let i=0;i<100 && current(s)!.alive && current(s)!.ageDays<60;i++) {
      s = s.area?.encounter?.status === 'active' ? respondToEncounter(s,'observe') : advancePaced(s).state;
    }
    expect(current(s)!.alive).toBe(true);
    expect(current(s)!.ageDays).toBe(60);
    expect(current(s)!.biology!.stores.fungus).toBeGreaterThan(30);
    expect(current(s)!.biology!.stores.contamination).toBeLessThan(70);
  });
  it('shows the useful leaf harvest even when the ant does not get a meal', () => {
    let s = born('ant');
    // Adult fixture tests this command's exact consequence, not the fresh-life experience.
    current(s)!.ageDays=60; s.world!.activePatch='forage';
    const before=current(s)!.biology!.stores.substrate;
    s=interact(s,'cut-leaves');
    expect(current(s)!.biology!.stores.substrate).toBeGreaterThan(before);
    expect(eventText(s.area!.outcome!.summary,'simple')).toMatch(/Leaf plant material reaches the colony/);
    expect(s.area!.outcome!.changes.some(c=>c.startsWith('Leaf material: +'))).toBe(true);
  });
  it('signals a real garden crisis without changing the narration-mode outcome', () => {
    const s=born('ant'); current(s)!.biology!.stores.fungus=0;
    expect(situationText(s)).toMatch(/garden needs help/);
    const detailed=structuredClone(s); detailed.narration='detailed';
    const a=act(s,'wait'),b=act(detailed,'wait');
    expect({...a,narration:'same'}).toEqual({...b,narration:'same'});
  });
});
