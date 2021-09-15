
const svg = document.getElementById('typeSvg');
let ctm = svg.getScreenCTM();
let inverse = ctm.inverse();
const textValue = "Hello"
const input = document.getElementById('typeInput');
let font;
let fontSize = 500;
let clickedP = [];
let dragging = false;
let maintainOffset = false;
let actualClicked;
let tempPathData = '';
let tempGuideData = [];
let guideCopy = [];
let storeOffset = {prev:{},next:{}};
const scale = 0.7;
const allPointList = [];
const allPathList = [];
const allGuideList = [];
const pathStyle = {
    rectWH: 12,
    circleR: 7,
    strokeColor: 'dodgerblue',
    glyphFill: 'transparent',
    pointFill: 'transparent',
    handleColor: 'lightpink',
    pointColor: '#FF4AFF',
    glyphStrokeWidth: 8,
    guideStrokeWidth: 4,
    glyphLine: ()=>{
        return  {
            'fill': pathStyle.glyphFill,
            'stroke': pathStyle.strokeColor,
            'stroke-width': pathStyle.glyphStrokeWidth,
            'stroke-linecap': "miter",
            'stroke-dasharray': '10 10'
            //'style': 'transform : scaleY(-1) translateY(-50%)'
        }
    },
    cornerPoint: ()=>{
        return {
            'fill': pathStyle.glyphFill,
            'stroke': pathStyle.pointColor,
            'stroke-width': pathStyle.guideStrokeWidth
        }
    },
    handleLine: ()=>{
        return {
            'fill': pathStyle.pointFill,
            'stroke': pathStyle.handleColor,
            'stroke-width': pathStyle.guideStrokeWidth
        }
    },
    handlePoint: ()=>{
        return {
            'fill': pathStyle.pointFill,
            'stroke': pathStyle.handleColor,
            'stroke-width': pathStyle.guideStrokeWidth
        }
    }
}
class Point{
    constructor(x, y, pointType, id){
        this.x = x || 0;
        this.y = y || 0;
        this.t = pointType;
        this.id = id || '';
        this.r = this.t==='handlePoint' ? pathStyle.circleR : 0
        this.s = this.t==='cornerPoint' ? pathStyle.rectWH : 0
    }
    drawPoint = function(){
        switch (this.t) {
            case 'handlePoint':
                this.el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                setAttributes(this.el, {
                    cx: this.x,
                    cy: this.y,
                    r: this.r,
                    id: this.id
                })
                return this.el;
            case 'cornerPoint':
                this.el = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                setAttributes(this.el, {
                    x: this.x - this.s / 2,
                    y: this.y - this.s / 2,
                    width: this.s,
                    height: this.s,
                    id: this.id
                })
                return this.el;
            case 'pathEnd':
                return;
            default:
                return;
        }
    }
    moveTo = function(x, y){
        this.x = x || 0;
        this.y = y || 0;
        if(this.el){
            switch (this.el.tagName) {
                case 'circle':
                    setAttributes(this.el,{
                        cx: this.x,
                        cy: this.y
                    })
                    break;
                case 'rect':
                    setAttributes(this.el,{
                        x: this.x - this.s / 2,
                        y: this.y - this.s / 2 
                    })
                    break;
                default:
                    break;
            }
        }
    }
}
class Guide{
    constructor(group, points, classList){
        this.group = group;
        this.points = points;
        this.len = points.length;
        this.x1 = points[0][0];
        this.y1 = points[0][1];
        this.x2 = points[1][0];
        this.y2 = points[1][1];
        this.classList = classList;
    }

    guide = document.createElementNS("http://www.w3.org/2000/svg", "line");
    
    drawGuide = function(){
        setAttributes(this.guide,{
            x1 : this.x1,
            y1 : this.y1,
            x2 : this.x2,
            y2 : this.y2,
            class: this.classList
        })
        this.group.appendChild(this.guide)
    }

    getPoints = function(){
        return [[this.x1, this.y1],[this.x2, this.y2]]
    }

    movePointTo = function(i, x, y){
        //console.log(i,x,y)
        let isPrev, isNext, isIdentical//, startPoint, endPoint;

        isIdentical = isIdenticalArray(actualClicked,i) 
        isPrev = actualClicked[1] > i[1] ? true : false
        isNext = actualClicked[1] <= i[1] ? true : false
        const attr = {}

        if (maintainOffset && isNext){
            attr.x1 = x//this.x2;
            attr.y1 = y//this.y2;  
            attr.x2 = x + storeOffset.next.xOffset
            attr.y2 = y + storeOffset.next.yOffset
            attr.log = 'prev'
            //console.log('corner Selected//corner moving')
        }else if(maintainOffset && isPrev){
            attr.x1 = x//this.x1;
            attr.y1 = y//this.y1;
            attr.x2 = x + storeOffset.prev.xOffset
            attr.y2 = y + storeOffset.prev.yOffset
            attr.log = 'next'
            //console.log('corner Selected//handle moving')
        }else{
            attr.x1 = x
            attr.y1 = y
            attr.log = 'h'
            //console.log(this, 'handle Selected')
        }
        setAttributes(this.guide, attr)

    }
}
class Path{
    constructor(group, points){
        this.group = group;
        this.points = points;
        this.d = getPathData(this.points)
    }
    path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    drawPath = function(){
        setAttributes(this.path, {
            d: this.d,
        })
        this.group.appendChild(this.path);
    }
    checkMovingPoint = function(){
        let points
        points = getPathData(this.points).split(/\s{1,}/)
        return points
        //s = i.split('p')[1]
    }
    movePointTo = function(i, x, y){
        let c, xy
        xy = tempPathData[i[1]]
        c = xy.charAt(0)
        c = !c.match(/\d/) ? c : '';
        xy = xy.getIdFromTarget(',');
        xy = c.concat([x, y].join(' '))
        tempPathData[i[1]] = xy
        //console.log(i, tempPathData.join(' '))
        setAttributes(this.path,{
            d: tempPathData.join(' ')
        })
        allPointList[i[0]][i[1]].moveTo(x, y)
        
    }
}
String.prototype.getIdFromTarget = function(s){
    return this.substring(1).split(s)
}
function round2DecPl(num){
    return Math.round(num*100)/100 
}

function setAttributes(el, attrs) {
    for(const key in attrs) {
    el.setAttribute(key, attrs[key]);
    }
}
function isIdenticalArray(arr1, arr2){
    return JSON.stringify(arr1)===JSON.stringify(arr2)
}
let _assign = function __assign() {
    _assign = Object.assign || function __assign(t) {
      for (let s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
  
        for (let p in s) {
          if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
      }
  
      return t;
    };
  
    return _assign.apply(this, arguments);
};

const transform = function transform(x, yMax, yMin) {
    return function (command) {
        const cloned = _assign({}, command);
        if (typeof cloned.x !== 'undefined') {
        cloned.x += x;
        }
        if (typeof cloned.y !== 'undefined') {
            cloned.y = yMax - cloned.y -yMin;
        }

        if (typeof cloned.x1 !== 'undefined') {
        cloned.x1 += x;
        }
        if (typeof cloned.y1 !== 'undefined') {
            cloned.y1 = yMax - cloned.y1 -yMin;
        }

        if (typeof cloned.x2 !== 'undefined') {
        cloned.x2 += x;
        }
        if (typeof cloned.y2 !== 'undefined') {
            cloned.y2 = yMax - cloned.y2 -yMin;
        }

        return cloned;
    };
}; 
const invertY = function invertY(yMax, yMin) {
    return function (command) {
        const cloned = _assign({}, command);
  
        if (typeof cloned.y !== 'undefined') {
            cloned.y = yMax - cloned.y -yMin;
        }

        if (typeof cloned.y1 !== 'undefined') {
            cloned.y1 = yMax - cloned.y1 -yMin;
        }

        if (typeof cloned.y2 !== 'undefined') {
            cloned.y2 = yMax - cloned.y2 -yMin;
        }

        return cloned;
    };
  };

const isntNaN = function isntNaN(value) {
    return !isNaN(value);
};
const scaleGlyphs = function(scale){
    return function(command){
        const cloned = _assign({}, command);
        for(let key in cloned){
            if (typeof(cloned[key]) === 'number') cloned[key] = round2DecPl( cloned[key] * scale );
        }
        return cloned;
    }
} 
function commandToPoints(command, arr){
    const type =command.type,
        x = command.x,
        y = command.y,
        x1 = command.x1,
        y1 = command.y1,
        x2 = command.x2,
        y2 = command.y2
    switch(type){
        case 'M':
        case 'L':
            arr.push({
                'type': 'cornerPoint',
                'x': x,
                'y': y        
            });
            break;
        case 'Q':
            break;
        case 'C':
            arr.push({
                'type': 'handlePoint',
                'x': x1,
                'y': y1        
            },{
                'type': 'handlePoint',
                'x': x2,
                'y': y2    
            },{
                'type': 'cornerPoint',
                'x': x,
                'y': y        
            })
            break;
        case 'Z':
            arr.push({
                'type': 'pathEnd'
            })
            break;
        default:
            break  
    }
    return arr
}

function getPoints(commands){
    return commands.map((v)=>{
        const pointArr = []
        return commandToPoints(v, pointArr)
    }).flat()
}

function getPathData(pts){
    let command;
    let type;
    let temp = [];
    pts.reduce((acc, curr)=>{
        //console.log(idx)
        let prev = acc.slice(-1)[0];
        command = !prev || command===' Z ' ? 'M' : command;
        //console.log(`${acc}, idx: ${idx}, command: ${command}`)
        //console.log(curr)
        temp.push(acc)            
        switch (curr.t) {
            case 'cornerPoint':
                if (command !== 'M') command = (type === 'cornerPoint') ? ' L' : ''
                type = curr.t;
                return command.concat(curr.x).concat(',', curr.y)
            case 'handlePoint':
                command = (command === 'M'|| command === ' L'|| command === '') ? ' C' : ''
                type = curr.t;
                return command.concat(curr.x).concat(',', curr.y)
            case 'pathEnd':
                command = ' Z '
                type = curr.t;
                return command
            default:
                break;
        }
    },[])
    return temp.flat().join(' ').concat(' Z')
}

(async function initFont(){
    font = await opentype.load('https://parkminwoo.com/font/Hesiod-Regular.otf');
    if(svg.hasChildNodes()) svg.removeChild(document.querySelector('path'))
    const ascender = font.tables.os2.sTypoAscender;
    const descender = font.tables.os2.sTypoDescender;
    const glyphArr = font.stringToGlyphs(textValue).reduce(function (accum, curr) {
        let prev = accum.slice(-1)[0];
        let x = prev ? prev.x + prev.advanceWidth + (font.getKerningValue(prev, curr) || 0) + (font.letterSpacing || 0) : 0;
        let commands = curr.path.commands.map(transform(x, ascender, descender)).map(scaleGlyphs(scale));
        return accum.concat([_assign({}, curr, {
          x: x,
          xMax: x + curr.xMax,
          xMin: x + curr.xMin,
          ascender: ascender,
          descender: descender,
          commands: commands,
          points: getPoints(commands)
        })]);
    }, []).filter(function (e) {
        return e.commands && e.commands.length > 0;
    });

    const pathGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const pointGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const guideGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const cornerPointGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const handlePointGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    pointGroup.append(cornerPointGroup, handlePointGroup)
    svg.appendChild(pathGroup)
    svg.appendChild(guideGroup)
    svg.appendChild(pointGroup)
    setAttributes(pathGroup, pathStyle.glyphLine())
    setAttributes(guideGroup, pathStyle.handleLine())
    setAttributes(handlePointGroup, pathStyle.handlePoint())
    setAttributes(cornerPointGroup, pathStyle.cornerPoint())




    //get points from glyphArray    
    for(let i of glyphArr){
        const pts = [];
        //let isEnd = false;
        let pathStart = {};
        let idx = glyphArr.indexOf(i)
        i.points.forEach((e , j) => {
            //isEnd = (e.x === pathStart.x && e.y === pathStart.y) ?  true : false
            //console.log([pathStart.x, pathStart.y],[e.x, e.y], isEnd)
            let p= new Point(e.x, e.y, e.type, `g${idx}p${j}`)
            if (!pathStart.x && !pathStart.y || !p.x && !p.y){
              pathStart.x = p.x || 0;
              pathStart.y = p.y || 0;  
            }
            //console.log([pathStart.x, pathStart.y], [p.x, p.y], !pathStart.x && !pathStart.y)
            pts.push(p)
        });   
        //console.log(pts)         
        //onsole.log(getPathData(pts))
        allPointList.push(pts)


        const guides = {};
        pts.reduce((acc, curr)=>{
            let prev = acc.slice(-1)[0];
            if(prev && acc[0] !== curr.t && prev[0] && prev[1] && curr.x && curr.y){
                let pointsArr = [];
                if (curr.t === 'handlePoint' && acc[0] === 'cornerPoint'){
                    pointsArr = [[curr.x, curr.y], prev]
                }else if (curr.t === 'cornerPoint' && acc[0] === 'handlePoint'){
                    pointsArr = [prev, [curr.x, curr.y]]
                }
                let g = new Guide(guideGroup,pointsArr, `${acc[1]} ${curr.id}`)
                guides[`${acc[1]} ${curr.id}`] = g
                //console.log(g)
            }
            return [curr.t, curr.id, [curr.x, curr.y]]
        },[])
        allGuideList[idx] = guides




        const P = new Path(pathGroup, pts)
        P.id = `path${idx}`
        allPathList.push(P)

    }

    //draw points
    allPointList.forEach(v=>{
        v.map(w=>{
            let p = w.drawPoint()
            if (w.t === 'cornerPoint'){
                cornerPointGroup.append(p)
            } 
            else if(w.t === 'handlePoint'){
                handlePointGroup.append(p)
            }
        })
    })
    // draw paths
    allPathList.forEach(v=>{
        v.drawPath()
    })
    
    allGuideList.forEach(v=>{
        for(let w in v){
            v[w].drawGuide()
        }
    })


//    console.log(glyphArr[0])

})();


svg.addEventListener('mousedown',e=>{
    let t = e.target
    if (t.id.match(/g\d*p\d*/)){
        tempGuideData = [];
        clickedP =  t.id.getIdFromTarget('p')
        actualClicked =  clickedP
        tempPathData = allPathList[clickedP[0]].checkMovingPoint(clickedP[1])
        document.querySelectorAll(`.${t.id}`).forEach((v, i)=>{
            tempGuideData[i] = {};
            tempGuideData[i].x1 = v.getAttribute('x1')
            tempGuideData[i].x2 = v.getAttribute('x2')
            tempGuideData[i].y1 = v.getAttribute('y1')
            tempGuideData[i].y2 = v.getAttribute('y2')
            tempGuideData[i][0] = v.getAttribute('class')
        })
        dragging = true;
        let prev = allPointList[clickedP[0]][clickedP[1] * 1 - 1]||0
        let next = allPointList[clickedP[0]][clickedP[1] * 1 + 1]||0
        if(allPointList[clickedP[0]][clickedP[1]].t === 'cornerPoint' ){
            maintainOffset = true;
            storeOffset.prev.xOffset = allPointList[clickedP[0]][clickedP[1]].x - prev.x;
            storeOffset.prev.yOffset = allPointList[clickedP[0]][clickedP[1]].y - prev.y;
            storeOffset.next.xOffset = allPointList[clickedP[0]][clickedP[1]].x - next.x;
            storeOffset.next.yOffset = allPointList[clickedP[0]][clickedP[1]].y - next.y;
        }
        //console.log(clickedP)
    }
}, false)

svg.addEventListener('mousemove', e=>{
    let g, pt;
    guideCopy = tempGuideData.slice();

    g = clickedP[0]
    pt = clickedP[1]

    if (dragging){
        let point = svg.createSVGPoint();
        [point.x, point.y] = [e.clientX, e.clientY]
        let p = point.matrixTransform(inverse)

        let prev = allPointList[g][pt * 1 - 1] || 0;
        let next = allPointList[g][pt * 1 + 1] || 0;
        allPathList[g].movePointTo(clickedP, p.x, p.y)

        if (maintainOffset){
            
            if(next.t && next.t === 'handlePoint'){ 
                let nextX = p.x - storeOffset.next.xOffset;
                let nextY = p.y - storeOffset.next.yOffset;
                let i = [g, (pt * 1 + 1).toString()]
                allPathList[g].movePointTo(i, nextX, nextY)

                //allGuideList[i[0]] : target glyph
                //guideCopy.slice(-1)[0][0] : clicked guide id string (reversed order)

                allGuideList[i[0]][guideCopy.slice(-1)[0][0]].movePointTo(i, nextX, nextY)
                guideCopy.pop()
            };

            if(prev.t && prev.t === 'handlePoint'){ 
                let prevX = p.x - storeOffset.prev.xOffset;
                let prevY = p.y - storeOffset.prev.yOffset;
                let i = [g, (pt * 1 - 1).toString()]
                allPathList[g].movePointTo(i, prevX, prevY)

                //allGuideList[i[0]] : target glyph
                //guideCopy.slice(-1)[0][0] : clicked guide id string (reversed order)
                allGuideList[i[0]][guideCopy.slice(-1)[0][0]].movePointTo(i, prevX, prevY)
                guideCopy.pop()
            }


        }else {
            //console.log(allGuideList[g][guideCopy.slice(-1)[0][0]])
            allGuideList[g][guideCopy.slice(-1)[0][0]].movePointTo(clickedP, p.x, p.y)
            guideCopy.pop()
        }
    }
}, false)

svg.addEventListener('mouseup', ()=>{
    //clickedP = null;
    dragging = false;
    maintainOffset = false;
//    tempGuideData = [];
}, false)

addEventListener('resize',()=>{
    ctm = svg.getScreenCTM()
    inverse = ctm.inverse()
})
//mousedown으로 클릭한 점 검출
//mousemove로 점에 관련있는 애들만 리페인트
//우선 배열에 넣어야겠네 그럼

