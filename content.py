"""
Site content: services, service areas and projects.
Edit this file, then run `python3 build.py` to regenerate the pages.
"""

SITE_URL = 'https://www.kaymanconstructions.com'
BRAND = 'Kayman Constructions'
TAGLINE = 'Build. Develop. Deliver.'

CONTACTS = [
    {'name': 'Kaif', 'email': 'kaif@kaymanconstructions.com', 'phone': '+1 (209) 351-1726', 'tel': '+12093511726'},
    {'name': 'Amaan', 'email': 'amaan@kaymanconstructions.com', 'phone': '+1 (773) 349-5504', 'tel': '+17733495504'},
]
# the main number used on "Call" buttons
PHONE = CONTACTS[0]['phone']
PHONE_TEL = CONTACTS[0]['tel']

# ---------------------------------------------------------------- services

SERVICES = [
    {
        'slug': 'kitchen-remodeling',
        'name': 'Kitchen remodeling',
        'group': 'Remodeling',
        'title': 'Kitchen Remodeling in Houston',
        'summary': 'New layouts, custom cabinets, stone counters and islands, with the plumbing, gas and electrical moved to where you need them.',
        'intro': 'A kitchen remodel is mostly about what you can’t see: where the water, gas, venting and circuits run. We plan those first, then build the room around how you cook.',
        'includes': [
            'Layout changes and wall removal',
            'Custom and semi-custom cabinetry',
            'Quartz, granite and marble counters',
            'Islands with seating, sinks or cooktops',
            'Gas line and plumbing relocation',
            'Dedicated appliance circuits',
            'Range hoods vented outside',
            'Tile backsplashes and flooring',
            'Recessed, pendant and under-cabinet lighting',
        ],
        'houston': [
            ('Venting that actually vents', 'Many Houston kitchens have recirculating hoods. We duct new hoods to the outside, which matters when the AC runs ten months a year and cooking moisture has nowhere else to go.'),
            ('Slab plumbing', 'Most homes built since the 1960s sit on a slab, so moving a sink to an island means cutting the slab. We scope it before pricing so it isn’t a surprise mid-job.'),
        ],
        'timeline': 'Most kitchen remodels take 6 to 10 weeks of construction once materials are on site. Custom cabinets add lead time, so we order them as soon as the design is signed.',
        'faqs': [
            ('Can we live in the house during a kitchen remodel?', 'Usually, yes. We seal the work area with zip walls and negative air, and we can set up a temporary kitchen with a sink and a counter in another room.'),
            ('Do you handle permits?', 'Yes. Moving plumbing, gas or electrical needs a permit in every city we work in, and we pull and close them out ourselves.'),
            ('Can we keep our existing cabinets?', 'Sometimes. If the boxes are solid, refacing or painting can save a lot. We’ll tell you honestly at the walkthrough.'),
        ],
    },
    {
        'slug': 'bathroom-remodeling',
        'name': 'Bathroom remodeling',
        'group': 'Remodeling',
        'title': 'Bathroom Remodeling in Houston',
        'summary': 'Curbless showers, freestanding tubs and double vanities, waterproofed properly for Gulf Coast humidity.',
        'intro': 'Most failed bathrooms fail behind the tile. We tear down to the studs or the slab, waterproof the whole wet area, and then build the room you picked out.',
        'includes': [
            'Tub-to-shower conversions',
            'Curbless and walk-in showers',
            'Freestanding tubs',
            'Double vanities and makeup counters',
            'Full waterproofing membranes',
            'Heated floors',
            'Frameless glass',
            'Exhaust fans ducted outside',
            'Grab bars and aging-in-place layouts',
        ],
        'houston': [
            ('Humidity and mold', 'We use cement board and a continuous waterproofing membrane in wet areas, and fans sized for the room and ducted outside, not into the attic.'),
            ('Pier-and-beam houses', 'In older homes on piers, a curbless shower means lowering the floor framing. We check the joists before promising a zero-threshold entry.'),
        ],
        'timeline': 'A primary bath usually takes 4 to 7 weeks of construction. A hall bath with a simple layout can be done in about 3.',
        'faqs': [
            ('Can you convert a tub to a walk-in shower?', 'Yes, it’s one of our most common jobs. The drain usually has to move and the floor has to slope, which we handle as part of the remodel.'),
            ('How do you prevent leaks?', 'A continuous membrane under the tile, flood-tested before tile goes on. We photograph it so you have a record.'),
        ],
    },
    {
        'slug': 'whole-home-renovation',
        'name': 'Whole-home renovation',
        'group': 'Renovation',
        'title': 'Whole-Home Renovation in Houston',
        'summary': 'Older houses brought up to today, from foundation and wiring to finishes, planned as one project.',
        'intro': 'When a house needs more than one room redone, doing it all at once is faster and usually cheaper than doing it in pieces. We start with what’s behind the walls and work outward.',
        'includes': [
            'Foundation leveling and repair',
            'Rewiring and panel upgrades',
            'Re-plumbing (galvanized or cast iron replacement)',
            'New HVAC and ductwork',
            'Insulation and air sealing',
            'Windows, doors and siding',
            'Kitchens and bathrooms',
            'Flooring and trim throughout',
            'Roof replacement',
        ],
        'houston': [
            ('Foundations first', 'Expansive clay moves with the weather. Before any finish work we have the foundation checked, because new tile and drywall won’t survive a slab that’s still settling.'),
            ('Old pipes and wiring', 'Houses from the 1950s to the 1970s often have cast iron drains and aluminum or ungrounded wiring. A whole-home renovation is the right time to replace both.'),
        ],
        'timeline': 'Whole-home renovations run 4 to 9 months depending on size and scope. You’ll get a written schedule before we start and a weekly update while we work.',
        'faqs': [
            ('Do we need to move out?', 'For a full renovation, usually yes. Water and power are off for stretches, and it’s faster and safer to work in an empty house.'),
            ('Can you work in phases?', 'Yes. If budget or timing calls for it, we plan the whole house first and then build it in phases in a sensible order.'),
        ],
    },
    {
        'slug': 'open-concept-remodeling',
        'name': 'Open-concept remodeling',
        'group': 'Remodeling',
        'title': 'Wall Removal and Open-Concept Remodeling in Houston',
        'summary': 'Load-bearing walls replaced with engineered beams, so the kitchen, living and dining rooms become one space.',
        'intro': 'Taking out a wall is quick. Taking out a load-bearing wall safely takes an engineer, temporary shoring, a properly sized beam and a permit. We handle all of it.',
        'includes': [
            'Structural engineering',
            'Temporary shoring',
            'Flush or exposed beams (wood, LVL or steel)',
            'Rerouting ducts, pipes and wiring in the wall',
            'Floor patching and refinishing',
            'Ceiling repair and new lighting',
            'Fireplace and built-in updates',
        ],
        'houston': [
            ('Ducts in the way', 'Houston homes run a lot of ductwork through interior walls and attics. We plan where the returns and supplies go before the wall comes down, not after.'),
            ('Flush beams', 'Most people want the beam hidden in the ceiling. In a single-story house that usually works; in a two-story it depends on the floor framing above.'),
        ],
        'timeline': 'Removing a wall and installing a beam takes 1 to 3 weeks. Most clients pair it with a kitchen remodel, which sets the overall schedule.',
        'faqs': [
            ('How do you know if a wall is load-bearing?', 'We check the attic and the framing, and a structural engineer confirms it and sizes the beam.'),
            ('Will there be a post in the middle?', 'Not usually. Longer spans need a bigger beam, but posts can almost always be hidden in the remaining walls.'),
        ],
    },
    {
        'slug': 'room-additions',
        'name': 'Room additions',
        'group': 'Residential construction',
        'title': 'Room Additions and Second Stories in Houston',
        'summary': 'Primary suites, second stories and garage apartments, framed and finished to match the house.',
        'intro': 'A good addition looks like it was always there. We match the roofline, brick or siding, and floor heights, and we design the foundation for Houston’s soil.',
        'includes': [
            'Primary suite additions',
            'Second-story additions',
            'Garage apartments and ADUs',
            'Sunrooms and enclosed patios',
            'Engineered foundations',
            'Roofline and exterior matching',
            'HVAC sizing for the new space',
            'Permits and HOA approvals',
        ],
        'houston': [
            ('Tying into the slab', 'A new foundation has to move with the old one without cracking where they meet. We use engineered piers and doweled connections designed for expansive clay.'),
            ('Drainage', 'An addition covers ground that used to absorb rain. We regrade and add gutters and drains so water moves away from both the new and old foundations.'),
        ],
        'timeline': 'Most additions take 4 to 8 months from permit to move-in. Permits and HOA review can add 4 to 10 weeks up front, depending on the city.',
        'faqs': [
            ('Do I need a permit for an addition?', 'Always. We prepare the drawings, get engineering and pull the permit.'),
            ('Is it better to build up or out?', 'It depends on the lot, setbacks and the existing foundation. We look at both at the walkthrough.'),
        ],
    },
    {
        'slug': 'outdoor-living',
        'name': 'Outdoor living',
        'group': 'Residential construction',
        'title': 'Covered Patios and Outdoor Kitchens in Houston',
        'summary': 'Covered patios, pergolas and outdoor kitchens that are usable in a Houston summer and built to wind-load code.',
        'intro': 'An outdoor room in Houston needs shade, a fan and a roof that stays put in a storm. We build covered patios that tie into your roofline properly and outdoor kitchens with real gas and power.',
        'includes': [
            'Covered patios tied into the roof',
            'Pergolas (wood or aluminum)',
            'Outdoor kitchens and grills',
            'Gas, water and electrical runs',
            'Ceiling fans and lighting',
            'Concrete and paver patios',
            'Outdoor fireplaces',
            'Screened porches',
        ],
        'houston': [
            ('Wind load', 'Patio covers act like sails in a storm. We engineer the posts, footings and connections to current wind-load requirements.'),
            ('Drainage and slope', 'A new slab or pavers change how water leaves the yard. We slope everything away from the house and tie into existing drainage.'),
        ],
        'timeline': 'Covered patios take 3 to 6 weeks. Adding an outdoor kitchen usually adds 1 to 2 weeks.',
        'faqs': [
            ('Does a patio cover need a permit?', 'In most Houston-area cities, yes, and HOAs often need to approve it too. We handle both.'),
            ('Will a patio cover make my living room dark?', 'It can. We use skylights, taller ceilings or a pergola section to keep light coming into the house.'),
        ],
    },
    {
        'slug': 'custom-homes',
        'name': 'Custom homes',
        'group': 'Residential construction',
        'title': 'Custom Home Building in Houston',
        'summary': 'New homes built on your lot, from permit set to move-in.',
        'intro': 'Whether it’s a teardown in Bellaire or an empty lot in The Woodlands, we build custom homes with the same crew and the same project lead from foundation to final walkthrough.',
        'includes': [
            'Lot evaluation and surveys',
            'Working with your architect, or ours',
            'Engineered foundations',
            'Framing, roofing and envelope',
            'Energy-efficient mechanical systems',
            'Interior finishes and millwork',
            'Floodplain elevation where required',
            'Permits and final inspections',
        ],
        'houston': [
            ('Floodplain rules', 'Many Houston-area lots now require the finished floor to sit above the 500-year floodplain. We check the survey before design so the house works the first time.'),
            ('Energy code', 'We build tight, insulated houses with properly sized HVAC, which is what keeps a Houston summer bill reasonable.'),
        ],
        'timeline': 'A custom home typically takes 10 to 16 months of construction after permits are issued.',
        'faqs': [
            ('Do you build on my lot?', 'Yes, we build on lots our clients own. We can also help you evaluate a lot before you buy it.'),
            ('Do I need an architect?', 'You can bring your own, or we can introduce you to architects we work with.'),
        ],
    },
]

# ---------------------------------------------------------------- areas
# x, y: position on the service-area map (400 x 400, downtown at 200, 200)

AREAS = [
    {
        'slug': 'the-heights',
        'name': 'The Heights',
        'county': 'Harris County',
        'xy': (188, 168),
        'intro': 'One of Houston’s oldest neighborhoods, founded in 1891, full of bungalows and Victorians that need careful work.',
        'homes': 'Most Heights houses were built between the 1900s and the 1940s: wood-frame bungalows and cottages on pier-and-beam foundations, many with original shiplap under the drywall. New construction and additions fill in between them.',
        'permits': 'Parts of the neighborhood are city historic districts. Exterior changes visible from the street there need a Certificate of Appropriateness from the Houston Archaeological and Historical Commission before a building permit is issued. We prepare the application and drawings.',
        'ground': 'Pier-and-beam houses are easier to re-level than slabs, but older piers and sills often need replacing. Parts of the neighborhood near White Oak Bayou sit in the floodplain, which affects additions.',
        'services': ['bathroom-remodeling', 'kitchen-remodeling', 'whole-home-renovation', 'room-additions'],
        'nearby': ['memorial', 'bellaire'],
    },
    {
        'slug': 'katy',
        'name': 'Katy',
        'county': 'Harris, Fort Bend and Waller counties',
        'xy': (34, 196),
        'intro': 'Master-planned communities west of Houston, where most homes are 10 to 30 years old and ready for their first real update.',
        'homes': 'Much of Katy was built from the 1990s on, in communities like Cinco Ranch and Cross Creek Ranch. The houses are solid, but many still have builder-grade kitchens and baths and closed-off formal rooms that owners want opened up.',
        'permits': 'Homes inside Katy city limits are permitted by the City of Katy. Most master-planned communities sit in unincorporated county areas, where the HOA’s architectural review is the main approval for exterior work. We submit to both.',
        'ground': 'Homes near the Addicks and Barker reservoirs flooded during Hurricane Harvey in 2017. We check floodplain maps before planning additions or new slabs.',
        'services': ['kitchen-remodeling', 'open-concept-remodeling', 'outdoor-living', 'room-additions'],
        'nearby': ['memorial', 'sugar-land'],
    },
    {
        'slug': 'sugar-land',
        'name': 'Sugar Land',
        'county': 'Fort Bend County',
        'xy': (100, 302),
        'intro': 'Established neighborhoods from the 1980s and 1990s, where formal living rooms and closed kitchens are ready to come down.',
        'homes': 'Much of Sugar Land, including First Colony, was built from the late 1970s through the 1990s. Typical homes have a formal living room, a separate family room and a kitchen tucked behind a wall, which makes them good candidates for open-concept remodels.',
        'permits': 'The City of Sugar Land issues building permits, and most neighborhoods have an HOA architectural committee that reviews exterior changes and patio covers.',
        'ground': 'Fort Bend’s clay soils move a lot between wet and dry seasons. We check for foundation movement before removing walls or adding beams.',
        'services': ['open-concept-remodeling', 'kitchen-remodeling', 'bathroom-remodeling', 'outdoor-living'],
        'nearby': ['katy', 'pearland'],
    },
    {
        'slug': 'the-woodlands',
        'name': 'The Woodlands',
        'county': 'Montgomery and Harris counties',
        'xy': (170, 24),
        'intro': 'Wooded lots and village neighborhoods north of Houston, built from the 1970s on.',
        'homes': 'The Woodlands was founded in 1974, and its villages were built out over the next four decades. Homes range from 1970s and 1980s houses ready for full renovations to newer ones where owners mostly want outdoor living space.',
        'permits': 'Exterior work, including patio covers, additions and even some fences, usually needs approval through The Woodlands’ residential design review before it starts. Tree removal is restricted on many lots. We handle the submission.',
        'ground': 'Heavy tree cover means roots near foundations and a lot of shade. We plan footings around roots and design patio covers with light in mind.',
        'services': ['outdoor-living', 'whole-home-renovation', 'kitchen-remodeling', 'custom-homes'],
        'nearby': ['kingwood', 'the-heights'],
    },
    {
        'slug': 'pearland',
        'name': 'Pearland',
        'county': 'Brazoria, Harris and Fort Bend counties',
        'xy': (216, 318),
        'intro': 'One of the fastest-growing cities in the region, where families are adding space instead of moving.',
        'homes': 'Most Pearland homes were built in the 2000s and 2010s, in communities like Shadow Creek Ranch. They’re newer, but families outgrow them, which is why additions and primary suite expansions are common here.',
        'permits': 'The City of Pearland issues building permits, and many neighborhoods have HOA review for additions and exterior changes.',
        'ground': 'Pearland sits on expansive clay, and some areas are in the floodplain of Clear Creek. New foundations for additions are engineered for both.',
        'services': ['room-additions', 'kitchen-remodeling', 'outdoor-living', 'bathroom-remodeling'],
        'nearby': ['sugar-land', 'bellaire'],
    },
    {
        'slug': 'bellaire',
        'name': 'Bellaire',
        'county': 'Harris County',
        'xy': (152, 243),
        'intro': 'A small city inside Houston, where 1950s ranch homes sit next to new two-stories.',
        'homes': 'Bellaire was largely built out with 1950s ranch houses, and many have since been replaced with new homes. The ranch houses that remain are often worth renovating for their lot and location.',
        'permits': 'Bellaire is its own city with its own building department, separate from the City of Houston. Floodplain rules require elevated finished floors for new homes and substantial renovations in the floodplain.',
        'ground': 'Parts of Bellaire flooded during Tropical Storm Allison in 2001 and Hurricane Harvey in 2017. We check whether a renovation crosses the substantial-improvement threshold that triggers elevation requirements.',
        'services': ['custom-homes', 'whole-home-renovation', 'kitchen-remodeling', 'bathroom-remodeling'],
        'nearby': ['the-heights', 'memorial'],
    },
    {
        'slug': 'memorial',
        'name': 'Memorial',
        'county': 'Harris County',
        'xy': (118, 182),
        'intro': 'Large wooded lots and mid-century homes in west Houston and the Memorial Villages.',
        'homes': 'Memorial is known for 1950s and 1960s ranch homes on large, tree-covered lots. Many have original layouts and systems, which makes them strong candidates for whole-home renovation.',
        'permits': 'The Memorial Villages (Bunker Hill, Hedwig, Hilshire, Hunters Creek, Piney Point and Spring Valley) are separate cities with their own building departments and rules. Other parts of Memorial are in the City of Houston. We know which is which.',
        'ground': 'Mature trees and clay soil make foundation movement common. We check it before opening walls, and plan drainage along with the renovation.',
        'services': ['whole-home-renovation', 'kitchen-remodeling', 'open-concept-remodeling', 'custom-homes'],
        'nearby': ['the-heights', 'katy'],
    },
    {
        'slug': 'kingwood',
        'name': 'Kingwood',
        'county': 'Harris and Montgomery counties',
        'xy': (304, 64),
        'intro': 'The “Livable Forest” in northeast Houston, with homes from the 1970s through the 1990s.',
        'homes': 'Kingwood was developed from the 1970s on, and Houston annexed it in 1996. Many homes are 30 to 50 years old, with original kitchens and baths and dated layouts.',
        'permits': 'Kingwood homes are permitted by the City of Houston, and most neighborhoods have community association review for exterior changes.',
        'ground': 'Parts of Kingwood flooded when the San Jacinto River and Lake Houston rose during Hurricane Harvey. We check flood history and elevation before planning ground-floor work.',
        'services': ['whole-home-renovation', 'kitchen-remodeling', 'bathroom-remodeling', 'outdoor-living'],
        'nearby': ['the-woodlands', 'the-heights'],
    },
]

# ---------------------------------------------------------------- projects
# sample=True: placeholder content with stock photos. It is marked on the page
# and kept out of search engines. Replace photos and text with a real Kayman
# project, then set sample=False.

PROJECTS = [
    {
        'slug': 'kitchen-remodel-katy',
        'title': 'Kitchen remodel in Katy',
        'service': 'kitchen-remodeling',
        'area': 'katy',
        'sample': True,
        'summary': 'A 1990s builder kitchen with oak cabinets and a checkered floor, turned into a bright kitchen with a marble island that seats five.',
        'house': 'Two-story home built in 1998, 2,900 sq ft',
        'duration': '9 weeks',
        'scope': ['New cabinet layout', 'Marble island with seating', 'Gas line moved', 'Hood ducted outside', 'Engineered wood floors'],
        'story': [
            ('The house', 'A 1998 two-story in Cinco Ranch, bought by a young family in 2019. The kitchen was the original builder package: orange oak cabinets, a soffit above the uppers, a laminate counter and a small peninsula that cut the room off from the breakfast nook.'),
            ('Why they called us', 'Both parents cook, usually at the same time, with two kids doing homework at the counter. The peninsula forced everyone into one narrow aisle, and the microwave hood just pushed steam back into the room. They had collected three quotes for new cabinets, but nobody had asked how they actually used the kitchen.'),
            ('The plan', 'At the walkthrough we watched how traffic moved from the garage door to the fridge and the breakfast table. The plan removed the peninsula and the soffits, moved the range to the outside wall so a real hood could vent outdoors, and put a nine-foot marble island in the middle with seating on two sides. Cabinets go to the ceiling, so the soffit space became storage.'),
            ('What came up', 'Moving the range meant running a new gas line through the slab edge and the exterior wall. Behind the old soffit we found a bathroom drain line from upstairs, so we rerouted it into the wall cavity instead of boxing it back in. Cabinets were ordered the day the design was signed, and demolition started when they were two weeks out, so the kitchen was never open longer than it had to be.'),
            ('The result', 'Nine weeks of construction, with a temporary kitchen set up in the laundry room. Two people can cook side by side, the kids have their own side of the island, and the hood vents outside instead of into the ceiling.'),
        ],
        'photos': [
            ('katy-kitchen-before', 'Before', 'Dated kitchen with oak cabinets and a checkered floor'),
            ('katy-kitchen-after', 'After', 'Bright kitchen with white cabinets and a large marble island'),
        ],
    },
    {
        'slug': 'bathroom-remodel-the-heights',
        'title': 'Bathroom remodel in The Heights',
        'service': 'bathroom-remodeling',
        'area': 'the-heights',
        'sample': True,
        'summary': 'A tired blue-tile bathroom in a 1920s bungalow, rebuilt with a walk-in marble shower and a green vanity that suits the house.',
        'house': 'One-story bungalow built in 1924, 1,650 sq ft',
        'duration': '6 weeks',
        'scope': ['Tub converted to walk-in shower', 'Floor framing reinforced', 'Full waterproofing', 'Custom vanity', 'Fan ducted outside'],
        'story': [
            ('The house', 'A 1924 bungalow a few blocks off 19th Street, on its original pier-and-beam foundation. The only full bath had been redone in the 1970s with dark blue tile laid right over the old walls.'),
            ('Why they called us', 'The owner noticed the floor flexing next to the tub, and the fan vented straight into the attic, where the decking had started to stain. She wanted a walk-in shower she could keep using as she got older, in a style that still fit a 100-year-old house.'),
            ('The plan', 'Take the room down to the studs and joists, find out what was soft and why, then build it back properly: a walk-in shower with a continuous waterproofing membrane and a bench, marble walls, a painted vanity and brass fixtures that suit the period. A new fan, sized for the room, ducted outside through the roof.'),
            ('What came up', 'Opening the floor showed decades of slow leaking from the tub drain. Two joists had rotted at the ends. We sistered them with new lumber, added blocking and laid a new subfloor before anything else. The work was all inside the house, so it didn’t need historic district review, but we kept the original window and trim profile anyway.'),
            ('The result', 'Six weeks from demolition to the last coat of paint. The floor is solid, the shower has no curb to step over, and the attic stays dry.'),
        ],
        'photos': [
            ('heights-bath-before', 'Before', 'Old bathroom with dark blue tile walls'),
            ('heights-bath-after', 'After', 'Remodeled bathroom with a marble shower and green vanity'),
        ],
    },
    {
        'slug': 'open-concept-sugar-land',
        'title': 'Open-concept remodel in Sugar Land',
        'service': 'open-concept-remodeling',
        'area': 'sugar-land',
        'sample': True,
        'summary': 'A closed-off 1980s living room opened to the kitchen by replacing a load-bearing wall with a flush beam.',
        'house': 'Two-story home built in 1986, 3,100 sq ft',
        'duration': '7 weeks',
        'scope': ['Load-bearing wall removed', 'Flush LVL beam', 'Ducts rerouted', 'Floors patched and refinished', 'New recessed lighting'],
        'story': [
            ('The house', 'A 1986 two-story in First Colony, with the classic floor plan of its era: a dark family room with a stone fireplace, closed off from the kitchen by a load-bearing wall with a small pass-through.'),
            ('Why they called us', 'The family spent every evening split between two rooms that were six feet apart. They had been told by another contractor that the wall “probably” couldn’t come out because the second floor sat on it.'),
            ('The plan', 'It could come out, with the right beam. A structural engineer confirmed the load and sized a flush LVL beam that hides in the ceiling. The plan included temporary shoring, rerouting a return-air duct that ran through the wall, and patching the floors so they run continuously from the kitchen into the family room.'),
            ('What came up', 'The City of Sugar Land permit took three weeks. Once the drywall came off, the duct turned out to be the bigger job: it fed the upstairs return, so we rebuilt it through a closet instead of just shortening it. The structural work itself took eight days; floors, drywall, paint and new lighting took the rest.'),
            ('The result', 'Seven weeks in total. The kitchen, family room and breakfast area are now one space with daylight from both sides of the house, and the fireplace is visible from the stove.'),
        ],
        'photos': [
            ('sugarland-open-before', 'Before', 'Closed-off living room with a stone fireplace'),
            ('sugarland-open-during', 'During', 'Temporary shoring posts holding the ceiling while a wall is removed'),
            ('sugarland-open-after', 'After', 'Open living room and kitchen with light wood floors'),
        ],
    },
    {
        'slug': 'whole-home-renovation-memorial',
        'title': 'Whole-home renovation in Memorial',
        'service': 'whole-home-renovation',
        'area': 'memorial',
        'sample': True,
        'summary': 'A 1960s ranch house taken down to the studs: new wiring, plumbing and HVAC, then a new kitchen, baths and floors throughout.',
        'house': 'One-story ranch built in 1962, 2,600 sq ft',
        'duration': '6 months',
        'scope': ['Rewired and new panel', 'Cast iron drains replaced', 'New HVAC and ducts', 'Spray foam insulation', 'New kitchen and two baths'],
        'story': [
            ('The house', 'A 1962 ranch on a wooded half-acre in one of the Memorial Villages, with its original kitchen, cast iron drains and a 100-amp electrical panel.'),
            ('Why they called us', 'The owners loved the lot and the trees and had no interest in tearing the house down. But every repair uncovered another old system, and they wanted to fix the house once instead of one emergency at a time.'),
            ('The plan', 'Gut the interior, level the foundation, then replace everything behind the walls: wiring and panel, drains and supply lines, ductwork and HVAC. With the walls open we added spray foam insulation and moved the kitchen to the back of the house, facing the yard. After that came a new kitchen, two bathrooms, floors and trim throughout.'),
            ('What came up', 'The house is in a Village, so permits went through the village building department rather than the City of Houston, with its own inspection schedule. Under the slab, the cast iron drain had cracked in two places, which explained a recurring smell in the hall bath. Replacing it was already in the plan; finding it early kept it from becoming a surprise later.'),
            ('The result', 'Six months, with the owners living elsewhere during the work. The house keeps its mid-century footprint and its trees, with systems that should last another 50 years.'),
        ],
        'photos': [
            ('memorial-whole-before', 'Before', 'Original 1960s kitchen with wood cabinets'),
            ('memorial-whole-during', 'During', 'Interior framed and ready for drywall'),
            ('memorial-whole-after', 'After', 'New white kitchen with an island and pendant lights'),
        ],
    },
    {
        'slug': 'primary-suite-addition-pearland',
        'title': 'Primary suite addition in Pearland',
        'service': 'room-additions',
        'area': 'pearland',
        'sample': True,
        'summary': 'A 480 sq ft primary suite added to the side of a 2008 home, with its own bath and closet.',
        'house': 'One-story home built in 2008, 2,200 sq ft before the addition',
        'duration': '5 months',
        'scope': ['Engineered pier-and-slab foundation', 'Roofline matched', 'Brick matched', 'New HVAC zone', 'Bath and walk-in closet'],
        'story': [
            ('The house', 'A 2008 one-story in Shadow Creek Ranch: four bedrooms, a family of five, and a primary bedroom that shared a wall with the kids’ rooms. The side yard was wide, unused and mostly weeds.'),
            ('Why they called us', 'They had priced moving and decided they liked the neighborhood, the schools and the commute too much to leave. What they needed was a quiet room of their own, with a bath and a real closet.'),
            ('The plan', 'A 480 sq ft suite on the side of the house, with a bedroom, a bath and a walk-in closet. The new foundation sits on engineered piers, doweled into the existing slab so the two move together. The hip roof, framing and brick all match the original, and the suite gets its own HVAC zone so it doesn’t over-cool the rest of the house.'),
            ('What came up', 'HOA review and the City of Pearland permit took seven weeks together, mostly waiting on the HOA’s monthly meeting. We tracked down the brick plant that made the original brick, so the new wall matches without a visible seam.'),
            ('The result', 'Five months of construction, with the family living at home throughout. From the street, the addition looks like it was always part of the house.'),
        ],
        'photos': [
            ('pearland-addition-before', 'Before', 'Unused side yard next to the house'),
            ('pearland-addition-during', 'During', 'Wood framing for the new addition'),
            ('pearland-addition-after', 'After', 'Finished addition with wood floors and clerestory windows'),
            ('pearland-addition-after2', 'After', 'Furnished primary bedroom in the new addition'),
        ],
    },
    {
        'slug': 'covered-patio-the-woodlands',
        'title': 'Covered patio in The Woodlands',
        'service': 'outdoor-living',
        'area': 'the-woodlands',
        'sample': True,
        'summary': 'A bare concrete slab turned into a shaded outdoor room with a pergola, lighting and planting.',
        'house': 'Two-story home built in 1994',
        'duration': '4 weeks',
        'scope': ['Aluminum louvered pergola', 'Extended concrete patio', 'Outdoor lighting and outlets', 'Drainage regraded', 'Planting beds'],
        'story': [
            ('The house', 'A 1994 two-story in one of The Woodlands’ older villages, backing onto tall pines. The backyard had a small concrete slab and a fence, and nowhere shaded to sit from May to October.'),
            ('Why they called us', 'The owners wanted to eat outside most evenings, but the slab baked in the afternoon sun and the yard held water after every storm.'),
            ('The plan', 'Extend the slab, regrade the yard so water drains away from the house, and add an aluminum louvered pergola that opens for winter sun and closes for summer shade and rain. New outlets, lighting and planting beds finish the space.'),
            ('What came up', 'The pergola design went through The Woodlands’ residential design review before we ordered it. Two mature pines stood close to the new slab, so we placed the footings to avoid their main roots instead of removing the trees.'),
            ('The result', 'Four weeks of construction. The yard drains after storms, the pines stayed, and the patio is shaded through the hottest part of the day.'),
        ],
        'photos': [
            ('woodlands-patio-before', 'Before', 'Plain backyard with a fence and bare patio'),
            ('woodlands-patio-after', 'After', 'Backyard with a pergola, outdoor seating and planting'),
        ],
    },
]

# ---------------------------------------------------------------- about
# Text inside [[double brackets]] shows up highlighted on the page as a placeholder.
# While draft=True the page shows a draft note and is kept out of search engines.

ABOUT = {
    'draft': False,
    'title': 'Two partners, one standard for every house',
    'intro': 'Kayman Constructions is a Houston remodeling and building company run by its two partners, Kaif and Amaan. One of us is on every project, from the first walkthrough to the last punch-list item.',
    'story': [
        ('How it started', 'Kaif and Amaan started Kayman Constructions with a simple idea: remodeling a house should feel organized, not chaotic. Between them, they had seen how most home projects go. Estimates grow after the contract is signed, schedules slip without explanation, and when something goes wrong nobody picks up the phone. They wanted to run a company where the homeowner always knows what is happening, what it costs and who is responsible. Kayman is the result: two partners, one standard, and one of them on every job.'),
        ('Why we do it this way', 'Most people who call a contractor have already been burned once: a vague estimate, a crew that disappears for weeks, a finish that looked nothing like the drawing. We built Kayman around the opposite. Every job gets a line-item estimate you can compare, a written schedule, and one partner who is responsible for it from start to finish. When something behind the walls changes the plan, you hear it from us that day, with the options and the cost.'),
        ('Why Houston', 'Houston houses have their own problems: clay soil that moves, ten months of air conditioning, hurricane season and floodplain rules that change from one city to the next. Greater Houston is also one of the fastest-growing regions in the country, full of houses that need to work harder: older homes inside the Loop that deserve careful renovation, and newer suburban homes that families would rather grow into than leave. We plan for those things at the first walkthrough instead of discovering them halfway through the job.'),
        ('Where we’re going', 'We’re growing one finished house at a time, and we would rather do fewer projects well than more projects badly. Our measure of success is simple: every client should be glad to recommend us to their neighbors, and every house we touch should be better built than the day we found it.'),
    ],
    'promise': [
        ('Build', 'We build to code and then past it, with the parts nobody sees (waterproofing, flashing, framing connections) done as carefully as the parts everybody does.'),
        ('Develop', 'We develop the plan with you before we pick up a tool: drawings, selections, permits and a schedule, so the build follows a plan you’ve already agreed to.'),
        ('Deliver', 'We deliver what the estimate says, on the schedule we gave you, and we walk the finished house with you until the punch list is empty.'),
    ],
    'partners': [
        {'name': 'Kaif', 'role': 'Co-founder', 'bio': 'Kaif leads the front end of every project: the first walkthrough, measurements, design decisions and the line-item estimate. When you call about a new project, Kaif is usually the one who comes out to see the house, and stays your point of contact through drawings and material selections. Every estimate gets checked against the plans before it goes out, so the number you sign is the number you pay.'},
        {'name': 'Amaan', 'role': 'Co-founder', 'bio': 'Amaan runs the build: permits and inspections, scheduling, crews and subcontractors. Once construction starts, Amaan is on site every week, sends the written progress updates and makes sure the site is swept at the end of each day. At the end of the job, Amaan walks the finished work with you and stays until the punch list is empty.'},
    ],
}
