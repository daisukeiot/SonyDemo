﻿$("#cosmosDbJsGrid").jsGrid({
    width: "100%",
    height: "59vh",

    loadIndication: true,
    loadIndicationDelay: 500,
    loadShading: true,
    shrinkToFit: true,
    multiselect: true,
    editing: false,
    inserting: false,
    filtering: false,
    sorting: true,
    paging: true,
    autoload: false,
    allowSelection: true,
    selectionSettings: { persistSelection: true },
    pageSize: 20,

    controller: {
        loadData: function (filter) {

            toggleLoader(false);
            var d = $.Deferred();

            $.ajax({
                type: "GET",
                url: window.location.origin + '/' + 'cosmosdb/loadData',
                data: {
                    threshold: document.getElementById("cosmosDbThreshold").innerHTML,
                    recordCount: document.getElementById("cosmosDbRecordCount").innerHTML,
                },
                contentType: "application/json; charset=utf-8",
                dataType: "json"
            }).done(function (response) {
                var array = JSON.parse(response.value);
                array = $.grep(array, function (value) {
                    return ((!filter.Id || value.Id.toUpperCase().indexOf(filter.Id.toUpperCase()) > -1) &&
                        (!filter.Ts || value.Ts.toUpperCase().indexOf(filter.Ts.toUpperCase()) > -1) &&
                        (!filter.Device_ID || value.Device_ID.toUpperCase().indexOf(filter.Device_ID.toUpperCase()) > -1) &&
                        (!filter.Model_ID || value.Model_ID.toUpperCase().indexOf(filter.Model_ID.toUpperCase()) > -1) &&
                        (filter.Image == undefined || value.Image == filter.Image));
                });

                d.resolve(array);
                $("#cosmosDbJsGrid").jsGrid("sort", { field: "Ts", order: "desc" });
                toggleLoader(true);
            });

            return d.promise();
        }
    },

    fields: [
        { name: "Id", type: "text", align: "left", width:200 },
        { name: "Ts", type: "number", align: "left"},
        { name: "Device_ID", type: "text", align: "left" },
        { name: "Model_ID", type: "text", align: "left"},
        { name: "Image", type: "checkbox", align: "left", width: 50},
        {
            name: "T",
            type: "text",
            align: "left"
        },
        { name: "C", type: "text", align: "left", width: 50 },
        { name: "P", type: "text", align: "left", width: 50, filtering: false },
        { name: "Coord", type: "text", title: "(X,Y)-(x,y)", align: "left", filtering: false },
        {
            type: "control", deleteButton: false, editButton: false,
            headerTemplate: function () {
                return this._createOnOffSwitchButton("filtering", this.searchModeButtonClass, false);
            },
            filtering: false
        }
    ],

    rowClick: function (args) {
        viewPhotoWithCosmosDbTable(args.item);
        //$row.toggleClass("highlight");
    },
});

function viewPhotoWithCosmosDbTable(item) {
    var funcName = `${arguments.callee.name}()`;
    console.debug(`=> ${funcName}`);

    if (item.Image == false) {
        return;
    }
    var deviceId = item.Device_ID;

    try {
        toggleLoader(false);
        var canvas = document.getElementById("photoCanvas");
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        GetImage(deviceId, item.T)
            .then((result) => {
                if (result) {
                    var json = JSON.parse(result);
                    var img = new Image();
                    img.src = json.uri;
                    img.onload = function () {
                        ctx.drawImage(img, 0, 0)
                        ctx.lineWidth = 3
                        ctx.strokeStyle = "rgb(255, 255, 0)"
                        ctx.font = '15px serif';
                        ctx.fillStyle = "rgb(255, 255, 0)"
                        ctx.textBaseline = "top";

                        var coord_text = item.Coord.replace(/\s+/g, '');

                        var coord_text_split = coord_text.split('-');

                        var coord_text_slice = coord_text_split[0].slice(1, -1).split(",");

                        var X = parseInt(coord_text_slice[0]);
                        var Y = parseInt(coord_text_slice[1]);

                        var coord_text_slice = coord_text_split[1].slice(1, -1).split(",");
                        var x = parseInt(coord_text_slice[0]);
                        var y = parseInt(coord_text_slice[1]);


                        ctx.strokeRect(X, Y, x - X, y - Y);
                        ctx.fillText(item.P, X + 5, Y + 5);

                        var modal = document.getElementById("modalPhoto");
                        modal.style.display = "block";
                    }
                }
            })
            .finally(() => {
                toggleLoader(false);
            });

    } catch (err) {
        msg = processError(funcName, err, true);
        ret = false;
        toggleLoader(true);
    }
}