/*
 * Generates a copy of specified sheet for any player in the campaign.
 *
 * Syntax: !get <sheetname>
 * Syntax: !delete
 * Syntax: !alldelete (GM only)
 */

var Charsheet = Charsheet || {};

on("chat:message", function(msg) {
    // Exit if not an api command
    if (msg.type != "api") return;

    if (msg.content.indexOf('!get') != -1) {
    // Exit if not a GM (disabled)
    //    if (!playerIsGM(msg.playerid)) return;
        Charsheet.Generate(msg);
    }  
    
    if (msg.content.indexOf('!delete') != -1) {
        Charsheet.Cleanup(msg);
    }
    
    if (msg.content.indexOf('!alldelete') != -1) {
    // Exit if not a GM
        if (!playerIsGM(msg.playerid)) return;
        Charsheet.CleanupAll(msg);
    }
});

Charsheet.Generate = async function(msg) {
        var generatorversion = "1.1.3";
        
        var playerid    = msg.playerid;
        log(playerid);
        var player      = msg.who;
        log(player);
        var critter     = msg.content.slice(5);
        log(critter);
        var crsheet     = findObjs({type: "character", name: critter}, {caseInsensitive: true});
        log(crsheet);
        
        // Return error message if no sheet found  
        log(crsheet.length)
        if (crsheet.length != 1) {
            sendChat(player, "/me has entered an invalid option: !get " + critter);
            return;
        };
        
        var crattrib    = findObjs({type: "attribute", _characterid: crsheet[0].id});
        log(crattrib);
        var crability    = findObjs({type: "ability", _characterid: crsheet[0].id});
        log(crability);
        
        var cravatar    = crsheet[0].get("avatar");
        
        crsheet[0].get("_defaulttoken",(crtokenraw)=>{
            let crtoken = JSON.parse(crtokenraw);
            var crimgsrc = crtoken.imgsrc.replace("max.png", "thumb.png");
            createObj("graphic", {
                imgsrc: crimgsrc,
                represents: character.id,
                left: crtoken.left,
                top: crtoken.top,
                width: crtoken.width,
                height: crtoken.height,
                name: crtoken.name,
                bar1_value: crtoken.bar1_value,
                bar2_value: crtoken.bar2_value,
                bar3_value: crtoken.bar3_value,
                bar3_max: crtoken.bar3_max,
                showname: "true",
                showplayers_name: "true",
                showplayers_bar3: "true",
                light_radius: crtoken.light_radius,
                light_dimradius: crtoken.light_dimradius,
                light_hassight: crtoken.light_hassight,
                pageid: crtoken.page_id,
                layer: "objects"
            });
        });
        
        /**
         * Templates
         */
        var template = {
          "gmnotes": "Player: " + player +
            "<br>Generated By: GetCritters " + generatorversion,
          "charactername": msg.who + "'s " + crsheet[0].get("name") +  " #" +
            (findObjs({_type: "character", controlledby: playerid}).length + 1)
        }
        template.channelalert = "copied a sheet named \"" +
          template.charactername + "\"!";
          
        /**
         * Permissions
         *
         * Valid values are "all" or comma-delimited list of player IDs.
         */
        /* Who can view the sheet */
        var viewableBy   = playerid;
        /* Who can edit the sheet */
        var controlledby = playerid;

        /**
         * Character generation
         */
        /* Create the base character object */
        var character = createObj("character", {
            name:             template.charactername,
            archived:         false,
            inplayerjournals: viewableBy,
            controlledby:     controlledby
        });
        /* Set GM Notes */
        character.set("gmnotes", template.gmnotes);
        
        /* Set Images */
        character.set("avatar", cravatar);
        
        /* Set Player's name */
        createObj("attribute", {
            name:         "player_name",
            current:      player,
            _characterid: character.id
        });
        /* Set Character's name */
        createObj("attribute", {
            name:         "name",
            current:      template.charactername,
            _characterid: character.id
        });
        /* Set script version, used for debugging */
        createObj("attribute", {
            name:         "sheet_generator",
            current:      "GetCritters v" + generatorversion,
            _characterid: character.id
        });
        
        /* Set attributes & abilities */
        crattrib.forEach(makeAttribs);
        crability.forEach(makeAbilitys);
        
        function makeAttribs(attrib, n) {
            createObj("attribute", {
                name: attrib.get("name"),
                current: attrib.get("current"),
                _characterid: character.id
            });
        };
        
        function makeAbilitys(ability, n) {
            createObj("ability", {
                name: ability.get("name"),
                description: ability.get("description"),
                action: ability.get("action"),
                istokenaction: ability.get("istokenaction"),
                _characterid: character.id
            });
        };
        
        sendChat(player, "/me " + template.channelalert + " [Click Here](https://app.roll20.net/vault/import_character) to import when ready.");
};

Charsheet.Cleanup = function(msg) {
        var playerid    = msg.playerid;
        log(playerid);
        var player      = msg.who;
        log(player);
        
        var oldsheets   = findObjs({type: "character", controlledby: playerid});
        log(oldsheets);
        
        if (oldsheets.length < 1) {
            sendChat(player, "/me has no sheets to delete!");
            return;
        };
        
        oldsheets.forEach(delSheets);
        
        function delSheets(sheet, n) {
            sheet.remove();
        };
        
        sendChat(player, "/me has deleted their copied sheets!");
};
    
Charsheet.CleanupAll = function(msg) {
        var playerid    = msg.playerid;
        log(playerid);
        var player      = msg.who;
        log(player);
        
        var allsheets   = findObjs({type: "character"});
        
        allsheets.forEach(delSheets);
        
        function delSheets(sheet, n) {
            if (sheet.get("inplayerjournals") != "all") {
            log(sheet);
            log(sheet.get("inplayerjournals"));
            sheet.remove();
            };
        };
        
        sendChat(player, "/me has deleted ALL copied sheets!");
};
