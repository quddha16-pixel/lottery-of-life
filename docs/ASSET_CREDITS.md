# Asset credits

## Wildlife photographs

Local image files are Wikimedia Commons thumbnails scaled by Wikimedia and cropped by CSS. The original photographs remain under their stated licenses; this does not establish a license for the game's source code. Follow each source page for the original, attribution and license history. Share-alike applies to adapted images under the relevant CC BY-SA license.

- **bumblebee** — [Bombus_terrestris.jpg](https://commons.wikimedia.org/wiki/File:Bombus_terrestris.jpg); Marco Almbauer; [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en). Local: `public/species/bumblebee.jpg`. Scaled thumbnail; displayed cropped.
- **ant** — [Atta_cephalotes-pjt.jpg](https://commons.wikimedia.org/wiki/File:Atta_cephalotes-pjt.jpg); Pjt56; [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0). Local: `public/species/ant.jpg`. Scaled thumbnail; displayed cropped.
- **rabbit** — [Oryctolagus_cuniculus_-_euqirneto_-_419737670_(cropped).jpeg](<https://commons.wikimedia.org/wiki/File:Oryctolagus_cuniculus_-_euqirneto_-_419737670_(cropped).jpeg>); euqirneto; [CC BY 4.0](https://creativecommons.org/licenses/by/4.0). Local: `public/species/rabbit.jpg`. Scaled thumbnail; displayed cropped.
- **wolf** — [Eurasian_wolf_2.jpg](https://commons.wikimedia.org/wiki/File:Eurasian_wolf_2.jpg); User:Mas3cf; [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0). Local: `public/species/wolf.jpg`. Scaled thumbnail; displayed cropped.
- **elephant** — [178_Male_African_bush_elephant_in_Etosha_National_Park_Photo_by_Giles_Laurent.jpg](https://commons.wikimedia.org/wiki/File:178_Male_African_bush_elephant_in_Etosha_National_Park_Photo_by_Giles_Laurent.jpg); Giles Laurent; [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0). Local: `public/species/elephant.jpg`. Scaled thumbnail; displayed cropped.
- **mallard** — [Anas_platyrhynchos_male_female_quadrat.jpg](https://commons.wikimedia.org/wiki/File:Anas_platyrhynchos_male_female_quadrat.jpg); Richard Bartz; [CC BY-SA 2.5](https://creativecommons.org/licenses/by-sa/2.5). Local: `public/species/mallard.jpg`. Scaled thumbnail; displayed cropped.

- **octopus** — [Octopus2.jpg](https://commons.wikimedia.org/wiki/File:Octopus2.jpg); albert kok; [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0). Local: `public/species/octopus.jpg`. Scaled thumbnail; displayed cropped.
- **meerkat** — [Meerkat_(Suricata_suricatta)_Tswalu.jpg](<https://commons.wikimedia.org/wiki/File:Meerkat_(Suricata_suricatta)_Tswalu.jpg>); Charles J. Sharp; [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0). Local: `public/species/meerkat.jpg`. Scaled thumbnail; displayed cropped.
- **bullfrog** — [North-American-bullfrog1.jpg](https://commons.wikimedia.org/wiki/File:North-American-bullfrog1.jpg); Carl D. Howe; [CC BY-SA 2.5](https://creativecommons.org/licenses/by-sa/2.5). Local: `public/species/bullfrog.jpg`. Scaled thumbnail; displayed cropped.
- **raccoon** — [Raccoon_in_Central_Park_(35264).jpg](<https://commons.wikimedia.org/wiki/File:Raccoon_in_Central_Park_(35264).jpg>); Rhododendrites; [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0). Local: `public/species/raccoon.jpg`. Scaled thumbnail; displayed cropped.
- **fox** — [Portrait_of_a_red_fox_in_Rautas_fjällurskog_(cropped).jpg](<https://commons.wikimedia.org/wiki/File:Portrait_of_a_red_fox_in_Rautas_fj%C3%A4llurskog_(cropped).jpg>); ClaudiaTen; [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0). Local: `public/species/fox.jpg`. Scaled thumbnail; displayed cropped.
- **robin** — [Erithacus_rubecula_with_cocked_head.jpg](https://commons.wikimedia.org/wiki/File:Erithacus_rubecula_with_cocked_head.jpg); Francis C. Franklin; [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0). Local: `public/species/robin.jpg`. Scaled thumbnail; displayed cropped.
- **seal** — [Common_seal_(Phoca_vitulina)_2.jpg](<https://commons.wikimedia.org/wiki/File:Common_seal_(Phoca_vitulina)_2.jpg>); Charles J. Sharp; [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0). Local: `public/species/seal.jpg`. Scaled thumbnail; displayed cropped.

## Fonts

DM Sans and Libre Caslon Display are bundled through Fontsource. Both use the SIL Open Font License 1.1. License notices are preserved in `docs/font-licenses/`. System fonts are fallbacks; gameplay makes no external font requests.

## Interface art

Inline line icons and the field-pack design are custom CSS/SVG. No licensed logo or third-party brand assets are used.


## Phase 3 habitat and animal scenes

`src/components/AnimalArt.tsx`, `HabitatDetails.tsx` and `WildlifeScene.tsx` contain original vector illustrations for all thirteen existing species. Active scenes no longer use the ten photo/specimen fallbacks. Selected developmental forms include insect brood, closed-eyed young mammals, ducklings, planktonic octopuses and frog eggs/tadpoles. Original location details include rounded bumblebee wax cells, living fungus mats, flowers, dens, reeds, caches and haul-outs. These stylized illustrations are not anatomical reference plates and do not derive from reference-site photographs or downloaded artwork. The credited photographs remain in collection/menu uses. CSS supplies gradients, changing light and optional rain motion. No new external image downloads, paid image APIs or runtime artwork services are required. The original work does not impose a new license on the repository.
