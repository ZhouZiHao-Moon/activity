'use strict'

var http = require('http');
var url = require('url');
var fs = require('fs');
var path = require('path');
var querystring = require('querystring');
var log4js = require('log4js');
log4js.configure(require("./log4js.json"));

var log = log4js.getLogger('log');

log.info('log4js started!');

var communities = ["阿卡贝拉","爱乐者联盟","北极阁史学社","博物知行","C3动漫社","藏映社","茶艺社","诚恒TV","楚汉棋社","《春风》编辑部","丹青书画社","笛箫学社","定向越野",
"ERP协会","管乐团","国际象棋协会","国旗班","航空航天社","合唱团","烘焙协会","红十字协会","机器人社团","极客社","集邮社","健美操","街舞社","锦瑟箫笙古风社","精武社","军事爱好者",
"TZBA篮球协会","朗诵配音协会","乐队","轮滑社","律谨科学社","美式辩论社","模拟联合国","模拟政协","魔方社","魔术社","墨缘书法","南通风筝社","琵琶行","乒乓球社","器乐社","千夏手工社",
"千竹社","琴说音乐钢琴社","青鸟志愿者","情调二胡","楸阳剧社","楸叶摄影社","楸艺影社","楸翼环保社团","楸云辩社","楸韵诗社","3D打印","声乐社","彩虹乐队","数学建模","素凡文学社",
"陶艺工坊","FLA天使爱心基金","天文爱好者","花样跳绳","通中单车社","通中记者团","通中女排","通中之声","通中足球社团","微足迹","围棋协会","未来领袖学院","未来之星","无人机社团",
"无线电社团","五公里俱乐部","五子棋协会","现代舞社","心理探秘","星川和风社","印象版画社","英语俱乐部","悠扬古筝社","瑜伽社","羽毛球爱好者","悦读社","云平台","张謇研究会",
"知津汉服社","周一讲团","篆刻协会"];

function getWeekOfYear(){
    var today = new Date();
    var firstDay = new Date(today.getFullYear(),0, 1);
    var dayOfWeek = firstDay.getDay(); 
    var spendDay= 1;
    if (dayOfWeek !=0) {
      spendDay=7-dayOfWeek+3;
    }
    firstDay = new Date(today.getFullYear(),0, 1+spendDay);
    var d =Math.ceil((today.valueOf()- firstDay.valueOf())/ 86400000);
    var result =Math.ceil(d/7);
    result = result + 11;
    return result;
};

function check(community)
{
    for(var i=0;i<communities.length;i++)
    {
        if(communities[i]==community) return true;
    }
    return false;
}

var server = http.createServer(function(request,response){
    var method = request.method;
    var url = request.url;
    if(method=='GET')
    {
        if(url=='/') url = '/static/index.html';
        if(url=='/admin'||url=='/admin/')
        {
            response.writeHead(302,{
                'Location': '/admin/'+new Date().getUTCFullYear().toString()+getWeekOfYear().toString()
            });
            response.end();
            return;
        }
        if(url.substring(0,7)=='/admin/') url = '/static/admin.html';
        if(url.substring(0,7)=='/static')
        {
            var filepath = path.join(path.resolve('.'),url);
            fs.stat(filepath,function(err,stats){
                if(!err && stats.isFile())
                {
                    response.writeHead(200);
                    fs.createReadStream(filepath).pipe(response);
                }
                else
                {
                    log.warn(" 404 Not Found:"+filepath);
                    response.writeHead(404);
                    response.end('404 NOT FOUND');
                }
            });
        }
        else
        {
            if(url!='/favicon.ico') log.warn(" 403 Forbidden:"+url);
            response.writeHead(403);
            response.end('403 Forbidden');
        }
    }
    else if(method=='POST')
    {
        if(url=='/submit/')
        {
            var data = '';
            var filepath = path.join(path.resolve('.'),'data',new Date().getFullYear().toString() + getWeekOfYear().toString());
            if(!fs.existsSync(filepath))
            {
                fs.mkdirSync(filepath);
            }
            request.on('data', function (chunk) {
                data += chunk;
            });
            request.on('end', function () {
                data = decodeURI(data);
                var dataObject = querystring.parse(data);
                if(!check(dataObject['name']))
                {
                    response.writeHead(200);
                    response.end('fail');
                    return;
                }
                filepath = path.join(filepath,dataObject["name"]);
                fs.exists(filepath+'.json',function(exists){
                    if(exists)
                    {
                        response.writeHead(200);
                        response.end('exists');
                    }
                    else
                    {
                        fs.writeFile(filepath+'.json',JSON.stringify(dataObject),function(err){
                            if(err)
                            {
                                log.error(err);
                            }
                            else
                            {
                                response.writeHead(200);
                                response.end('success');
                            }
                        });
                    }
                });
            });
        }
        else if(url.substring(0,7)=='/admin/')
        {
            var date = url.substring(7,13);
            if(/^\d\d\d\d\d\d$/.test(date))
            {
                var filepath = path.join(path.resolve('.'),'data',date);
                var names = [];
                var returndata = [];
                if(!fs.existsSync(filepath))
                {
                    log.warn(" 403 Forbidden:"+filepath);
                    response.writeHead(403);
                    response.end('403 Forbidden');
                    return;
                }
                var files = fs.readdirSync(filepath);
                files.forEach(function(item,index){
                    names.push(item);
                });
                for(var i=0;i<names.length;i++)
                {
                    var filedata = fs.readFileSync(path.join(filepath,names[i]));
                    returndata.push(JSON.parse(filedata));
                }
                response.writeHead(200);
                response.end(JSON.stringify(returndata));
            }
            else
            {
                log.warn(" 403 Forbidden:"+url);
                response.writeHead(403);
                response.end('403 Forbidden');
            }
        }
        else
        {
            log.warn(" 403 Forbidden:"+url);
            response.writeHead(403);
            response.end('403 Forbidden');
        }
    }
});

server.listen(8080);

console.log("running 8080");