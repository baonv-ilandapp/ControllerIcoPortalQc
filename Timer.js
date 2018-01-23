//SQL properties
const sql = require('mssql');
const config = 
{
    user: 'nhattm',
    password: 'TranMinhNhat123',
    server: 'ql-stk.database.windows.net', 
    database: 'QL_STK', 
    options: { encrypt: true }
}
const table = "WHITELIST_STATUS";
const rfrid = "rfrid";
const pending = "pending";

//RESTful properties
const Client = require('node-rest-client').Client;
const client = new Client();
const url = "https://p3.cynopsis.co/artemis_infocorp_uat//default/check_status.json?rfrID=";
const arg =    
{
    headers:
    {
        "Content-Type": "application/json",
        "WEB2PY-USER-TOKEN": "809d2c51-a434-4ec9-b9b7-8960f60dcd23"
    }    
};

// Date properties
var start = new Date();
var target = new Date(2018, 2, 26);
 
(async function () 
{
    try 
    {
        var instance = await sql.connect(config);
        while (new Date() < target)
        {
            var now = new Date();
            if (now.getTime() - start.getTime() >= 5 * 1000)
            {
                start = now;
                
                // Call database
                var query = 'select * from ' + table + " where " + pending + " = 'true'";
                let result = await instance.request().query(query);
                var customers = result.recordset;

                // Call Artemis
                for (var i = 0; i < customers.length; i++) 
                {
                    var rfrID = customers[i].rfrid;
                    client.get(url + customers[i].rfrid, arg, function (data, response) 
                    {
                        // Update database
                        if (data.approval_status == "CLEARED" || data.approval_status == "ACCEPTED") 
                        {
                            var query2 = "update " + table + " set " + pending + " = 'false' " +
                                "where " + rfrid + " = '" + data.rfrID + "'";
                            instance.request().query(query2);
                            console.log(data.rfrID + " Updated");
                        }
                    })
                    console.log(rfrID + " checked");
                }
            }     
        }
    } 
    catch (err) 
    {
        console.log(err);
    }
}) ().then(function()
{
    sql.close();
})

