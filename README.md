About
====
A small jQuery toolkit

Plugins
=======
### template
The template plugin is just a html5 lightweight javascript template engine

#### Example

The javascript
```js

$('body').template({
                    'first_name':'Takis',
                    'last_name':'Makis',
                    'age':23,
                    'showMeta':'Show Meta',
                    'showTable':'Show Table',
                    'caption':'Mplampla',
                    'test': false,
                    'meta':[
                        {'key':'1st Key', 'value':'1st Value'},
                        {'key':'2nd Key', 'value':'2nd Value'},
                        {'key':'3rd Key', 'value':'3rd Value'},
                        {'key':'3rd Key', 'value':'3rd Value'},
                        {'key':'3rd Key', 'value':'3rd Value'},
                        {'key':'3rd Key', 'value':'3rd Value'},
                        {'key':'3rd Key', 'value':'3rd Value'},
                        {'key':'3rd Key', 'value':'3rd Value'},
                        {'key':'3rd Key', 'value':'3rd Value'},
                        {'key':'3rd Key', 'value':'3rd Value'},
                        {'key':'3rd Key', 'value':'3rd Value'},
                        {'key':'3rd Key', 'value':'3rd Value'},
                        {'key':'3rd Key', 'value':'3rd Value'},
                        {'key':'3rd Key', 'value':'3rd Value'},
                        {'key':'3rd Key', 'value':'3rd Value'},
                    ]
               });

```

The html

```
<div data-replace="first_name"></div>
 <div data-replace="last_name"></div>
 <div data-replace="age"></div>
 <div data-replace="title"></div>

 <a href="javascript:void(0)" data-toggle="#table" data-replace="showTable">Show/Hide</a>

 <table border="1" id="table" data-repeat="meta">
     <tr>
        <td style="color:green"><div data-replace="name"></div></td>
        <td><div data-replace="last"></div></td>
      </tr>
 </table>
 <div data-logic="!caption">
      <div style="color:red" data-replace="caption"></div>
 </div>
 <div data-logic="!test">
      Sorry, the test is empty
 </div>

```

#### Usage

There are three major engines

#####Repeat 
```<div data-repeat="json array"></div>```

Inside data-repeat you can define the html template that will be used as the template of iterated object 


#####Replace 
```<div data-replace="json key"></div>```

#####Logic 
```<div data-logic="json key"></div>```

### showHide
The showHide plugin that can toggle elements on a page. Also it includes some makrups options for the elements

#### Options

```
{
     separator     : ',',
     joiner        : null,
     limit         : 2,
     showText      : "Show all ({{total}})",
     hideText      : "Show less ({{limited}})",
     wrapperMarkup : "{{items}}",
     markup        : "{{item}}",
     showAsTags    : false
}
```
##### Options Description
{{total}}   : Total number of items
{{limited}} : The number of limited items


#### Example

```js
$('#element').showHide({
 'separator': ';'
});
```





