/**
 * Created by Henrik Peinar on 01/04/16
 */

'use strict';

$().ready(function () {
    var board = new Board('#editor', 1280, 1040);
    var fileInput = $('#fileinput');
    window.board = board;

    /* Collection for human-readable sprite names */
    var spriteNames = getSpriteNames();

    var planId = window.location.pathname.match(/[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}/)
    if (planId && planId.length && planId.length === 1) {
        $.get('/api/'+ planId, function (data) {
            board.importData(data, function () {
                // handle switches if new save
                if (data.options) {
                    // highglihts
                    toggleMenuItem(null, '.highlight-scarecrow', board.showHighlights.bind(board, 'scarecrow'), board.hideHighlights.bind(board, 'scarecrow'), data.options.highlights.scarecrow);
                    toggleMenuItem(null, '.highlight-sprinkler', board.showHighlights.bind(board, 'sprinkler'), board.hideHighlights.bind(board, 'sprinkler'), data.options.highlights.sprinkler);
                    toggleMenuItem(null, '.highlight-bee', board.showHighlights.bind(board, 'hive'), board.hideHighlights.bind(board, 'hive'), data.options.highlights.bee);

                    // other options
                    toggleMenuItem(null, '.hide-stuff', board.showStuff.bind(board), board.hideStuff.bind(board), data.options.hidestuff);
                    toggleMenuItem(null, '.coordinates', board.showCoords.bind(board), board.hideCoords.bind(board), data.options.coordinates);
                    toggleMenuItem(null, '.brush-overwrite', function () {
                        board.brush.overwriting = true;
                    }, function () {
                        board.brush.overwriting = false;
                    }, data.options.overwriting);
                    toggleMenuItem(null, '.greenhouse-switch', function () {
                        board.background.attr('href', Board.toFullPath('img/full_background_gh_finished.jpg'));
                    }, function () {
                        board.background.attr('href', Board.toFullPath('img/full_background.jpg'));
                    }, data.options.greenhouse);
                }


                $('.editor-loader').hide();
            });
        });
    } else {
       $('.editor-loader').hide();
    }

    // show new version notification
    if (checkLocal() && !localStorage.getItem('stardew:versionNotification')) {
        $('.version-notification').show();
        $('.count-report-notification').css('top', $('.version-notification').height() + 20);
    }

    $('.hide-version-notification').click(function (e) {
        localStorage.setItem('stardew:versionNotification', true);
        $('.version-notification').hide();
        $('.count-report-notification').css('top', 10);
    });

    // show open source version notificaiton
    if (checkLocal() && !localStorage.getItem('stardew:opensourceNotification')) {
        $('.open-source-notification').show();
    }

    $('.hide-open-source-notification').click(function (e) {
        localStorage.setItem('stardew:opensourceNotification', true);
        $('.open-source-notification').hide();
    });

    /* Saves your epic work */
    $('#save').click(function (e) {
        e.preventDefault();

        var exportData = board.exportData();

        // also add options and highlight states to the save
        exportData.options = {
            highlights: {
                scarecrow: $('.highlight-scarecrow').hasClass('active'),
                sprinkler: $('.highlight-sprinkler').hasClass('active'),
                bee: $('.highlight-bee').hasClass('active')
            },
            greenhouse: $('.greenhouse-switch').hasClass('active'),
            coordinates: $('.coordinates').hasClass('active'),
            hidestuff: $('.hide-stuff').hasClass('active'),
            overwriting: $('.brush-overwrite').hasClass('active')
        };


        $.ajax({
            url: '/api/save',
            data: JSON.stringify(exportData),
            method: 'POST',
            contentType: 'application/json'
        }).always(function (data) {
            if (data.id) {
                window.location.href = '/planner/' + data.id;
            }
        });
    });

    /* Clears board */
    $('#reset').click(function () {
        if(window.confirm('Are you sure? You will lose all un-saved progress')) {
            window.location.href = '/';
        }
    });

    function toggleMenuItem(e, item, onFn, offFn, state) {
        if (e) {
            e.preventDefault();
        }

        var $i = $(item);
        if (state === undefined) {
            $i.toggleClass('active');
        } else {
            if (!state) {
                $i.removeClass('active');
            } else {
                $i.addClass('active');
            }
        }

        if ($i.hasClass('active')) {
            $i.find('i').addClass('fa-check').removeClass('fa-remove');
            if (typeof onFn === 'function') {
                onFn();
            }
        } else {
            $i.find('i').addClass('fa-remove').removeClass('fa-check');
            if (typeof offFn === 'function') {
                offFn();
            }
        }

    }

    /* Toggles highlight groups */
    $('.toggle-highlight').click(function (e) {
        var highlight = $(this).data('highlight');
        toggleMenuItem(e, $(this), board.showHighlights.bind(board, highlight), board.hideHighlights.bind(board, highlight));
    });


    $('.hide-stuff').click(function (e) {
        toggleMenuItem(e, '.hide-stuff', board.showStuff.bind(board), board.hideStuff.bind(board));
    });

    $('.coordinates').click(function (e) {
        toggleMenuItem(e, '.coordinates', board.showCoords.bind(board), board.hideCoords.bind(board));
    });

    $('.count-switch').click(function (e) {
        toggleMenuItem(e, '.count-switch', toggleCountDisplay, toggleCountDisplay);
    });

    $('.brush-overwrite').click(function (e) {
        toggleMenuItem(e, '.brush-overwrite', function () {
            board.brush.overwriting = true;
        }, function () {
            board.brush.overwriting = false;
        });
    });

    $('.freemode').click(function (e) {
        toggleMenuItem(e, '.freemode', function () {
            board.brush.freemode = true;
        }, function () {
            board.brush.freemode = false;
        });
    });



    /* Shows greenhouse repaired */
    $('.greenhouse-switch').click(function (e) {
        toggleMenuItem(e, '.greenhouse-switch', function () {
            board.background.attr('href', Board.toFullPath('img/full_background_gh_finished.jpg'));
        }, function () {
            board.background.attr('href', Board.toFullPath('img/full_background.jpg'));
        });
    });

    /** Currently not implemented as it doesn't render images correctly **/
    $('.save-png').click(function (e) {
        e.preventDefault();

        var svgData  = new XMLSerializer().serializeToString(document.getElementById('editor'));
        var img = document.createElement("img");
        var canvas = document.createElement("canvas");
        canvas.width = 1280;
        canvas.height = 1040;
        var ctx = canvas.getContext("2d");
        img.setAttribute("src", "data:image/svg+xml;base64," + btoa(svgData));

        img.onload = function() {
            ctx.drawImage(img, 0, 0, 1280, 1040);

            // Now is done
            window.open(canvas.toDataURL("image/png"));
        };
    });

    /* Selects new brush */
    $('.brush').click(function (e){
        e.preventDefault();

        board.deselectBuilding();
        board.brush.changeBrush($(this).data('type'));
    });

    /* Adds building to the board */
    $('.building').click(function (e) {
        e.preventDefault();

        board.placeBuilding($(this).data('id'));
    });

    /* Switches brush to erase mode */
    $('#eraser').click(function(e) {
        e.preventDefault();

        board.brush.changeBrush('eraser');
    });

    /* Listens for fileinput change */
    fileInput.on('change', function (e) {
        var file = $(this)[0].files[0];
        var fr = new FileReader();

        board.clear();
        $('.editor-loader').show();
        $('#editor').hide();
        var importer = new Importer(board);
        fr.onload = function (e) {
            var data = importer.parseData.call(importer, e);
            board.importData(data, function () {
                $('.editor-loader').hide();
                $('#editor').show();
                console.log('Import done');
            })
        };
        fr.readAsText(file);
    });

    /* The form for file upload is hidden, if user click on the menu link, "forward" the click to the form */
    $('#import').click( function(e){
        e.preventDefault();

        if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
            alert('The File APIs are not fully supported in this browser.');
            return;
        }

        if (!fileInput) {
            alert("Um, couldn't find the fileinput element.");
        }
        else if (!fileInput.files) {
            $('#fileinput').click();
        }
        else if (!fileInput.files[0]) {
            alert("Please select a file before clicking 'Load'");
        }
    });

    function checkLocal() {
        var mod = 'sdv:test';
        try {
            localStorage.setItem(mod, mod);
            localStorage.removeItem(mod);
            return true;
        } catch(e) {
            return false;
        }
    }

    /* Add names to spriteNames collection */
    function getSpriteNames() {
        var spriteNames = {};

        data.tiles.forEach(function(tile) {
            var name = $("li[data-type=" + tile + "]").text();
            if (name === '') {
                name = createSpriteName(tile);
            }

            spriteNames[tile] = name;
        });
        for (var building in data.buildings) {
            var name = $("li[data-id=" + building + "]").text();
            if (name === '') {
                name = createSpriteName(building);
            }

            spriteNames[building] = name;
        }

        return spriteNames;
    }

    /* Creates sprite name from id */
    function createSpriteName(id) {
        var name = id.replace('-', ' ');
        return name.charAt(0).toUpperCase() + name.substring(1);
    }

    window.addEventListener('updateCount', countObjects);

    function toggleCountDisplay() {
        if($('.count-report-notification').css('display') === 'none') {
            $('.count-report-notification').show();
        }
        else $('.count-report-notification').hide();
    }

    /* Counts the number of each object and puts it in the notification box. */
    function countObjects(e) {
        var counts = {};

        $("use").each(function(index) {
            var id = $(this).attr('href').substring(1);

            if (!counts[id]) {
                counts[id] = 1;
            } else {
                counts[id] += 1;
            }
        });

        var entries = [];
        for (var id in counts) {
            if (!spriteNames[id]) entries.push({name: createSpriteName(id), count: counts[id]});
            else entries.push({name: spriteNames[id], count: counts[id]});
        }

        // Sort first by number, and then alphanumerically
        entries.sort(function(a, b) {
            if (a.count === b.count) {
                return a.name.localeCompare(b.name);
            }
            return b.count - a.count;
        });

        var str = '';
        entries.forEach(function(thing) {
            str += '<div class="count-report-row"><div class="count-report-name">' + thing.name + ': </div><div class="count-report-count">' + thing.count + '</div></div>';
        });

        $('.count-report-notification .content').html(str);
    }
});
