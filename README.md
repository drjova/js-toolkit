About
====
A small jQuery toolkit

Plugins
=======
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





