var clients = [
    { "Device ID": "Otto Clay", "Model ID": "25", "Image": false, "T": "20211027044940287", "C": "0", "P": 0.9921875, "Coord": "14,12,309,307"}
];

var countries = [
    { Name: "", Id: 0 },
    { Name: "United States", Id: 1 },
    { Name: "Canada", Id: 2 },
    { Name: "United Kingdom", Id: 3 }
];

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
                toggleLoader(true);
            });

            return d.promise();
        }
    },

    fields: [
        { name: "Id", type: "text" },
        { name: "Ts", type: "number" },
        { name: "Device_ID", type: "text" },
        { name: "Model_ID", type: "text"},
        { name: "Image", type: "checkbox"},
        { name: "T", type: "text"},
        { name: "C", type: "text"},
        { name: "P", type: "text" },
        { name: "Coord", type: "text", title: "X Y x y" }
    ]
});