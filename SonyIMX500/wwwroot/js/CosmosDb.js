$("#cosmosDbJsGrid").jsGrid({
    width: "100%",
    height: "auto",

    loadIndication: false,
    inserting: false,
    editing: false,
    sorting: true,
    paging: true,
    autoload: false,
    //filtering: true,

    controller: {
        loadData: function (filter) {

            toggleLoader(false);
            var d = $.Deferred();

            $.ajax({
                type: "GET",
                url: window.location.href + 'cosmosdb/loadData',
                data: {
                    threshold: document.getElementById("cosmosDbThreshold").innerHTML
                },
                contentType: "application/json; charset=utf-8",
                dataType: "json"
            }).done(function (response) {
                d.resolve(JSON.parse(response.value));
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
        { name: "T", type: "text", align: "left"},
        { name: "C", type: "text", align: "left", width: 50},
        { name: "P", type: "text", align: "left", width: 50 },
        { name: "Coord", type: "text", title: "(X,Y)-(x,y)", align: "left" }
    ]
});