import{n as e}from"./rolldown-runtime-sJBDdmOt.js";import{n as t}from"./iframe-JEw0_rs5.js";function n({options:e,value:t,onChange:n,label:i,disabled:a=!1,orientation:o=`horizontal`,appearance:s=`segmented`,fullWidth:c=!1,className:l=``}){let u=`wm-toggle-group${o===`vertical`?` wm-toggle-group-vertical`:``}${c?` wm-toggle-group-full`:``}${s===`segmented`?``:` wm-toggle-group-${s}`}`;return(0,r.jsx)(`div`,{className:`${u} ${l}`,role:`group`,"aria-label":i,children:e.map(e=>(0,r.jsxs)(`button`,{type:`button`,className:`wm-toggle-group-btn${t===e.value?` wm-toggle-group-btn-active`:``}`,"aria-pressed":t===e.value,disabled:a||e.disabled,title:e.title,onClick:()=>n(e.value),children:[e.icon,e.swatchColor&&(0,r.jsx)(`span`,{className:`wm-toggle-group-swatch`,style:{background:e.swatchColor},"aria-hidden":`true`}),(0,r.jsx)(`span`,{children:e.label})]},e.value))})}var r;function i(){return(i=e((()=>{r=t(),n.__docgenInfo={description:``,methods:[],displayName:`ToggleGroup`,props:{options:{required:!0,tsType:{name:`unknown`},description:``},value:{required:!0,tsType:{name:`Value`},description:``},onChange:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(value: Value) => void`,signature:{arguments:[{type:{name:`Value`},name:`value`}],return:{name:`void`}}},description:``},label:{required:!0,tsType:{name:`string`},description:``},disabled:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`false`,computed:!1}},orientation:{required:!1,tsType:{name:`union`,raw:`"horizontal" | "vertical"`,elements:[{name:`literal`,value:`"horizontal"`},{name:`literal`,value:`"vertical"`}]},description:``,defaultValue:{value:`"horizontal"`,computed:!1}},appearance:{required:!1,tsType:{name:`union`,raw:`"segmented" | "outline" | "swatches"`,elements:[{name:`literal`,value:`"segmented"`},{name:`literal`,value:`"outline"`},{name:`literal`,value:`"swatches"`}]},description:``,defaultValue:{value:`"segmented"`,computed:!1}},fullWidth:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`false`,computed:!1}},className:{required:!1,tsType:{name:`string`},description:``,defaultValue:{value:`""`,computed:!1}}}}})))()}var a,o,s,c,l,u,d,f,p,m;function h(){return(h=e((()=>{i(),a=t(),{useArgs:o}=__STORYBOOK_MODULE_PREVIEW_API__,{fn:s}=__STORYBOOK_MODULE_TEST__,c={title:`Components/Forms/ToggleGroup`,id:`components-togglegroup`,render:function(e){let[,t]=o();return(0,a.jsx)(n,{...e,onChange:n=>{t({value:n}),e.onChange(n)}})},args:{label:`Project view`,value:`list`,onChange:s(),disabled:!1,options:[{value:`list`,label:`List`},{value:`board`,label:`Board`},{value:`calendar`,label:`Calendar`,disabled:!0}],orientation:`horizontal`,appearance:`segmented`,fullWidth:!1},argTypes:{value:{control:`select`,options:[`list`,`board`]},options:{control:!1},disabled:{control:`boolean`},orientation:{control:`select`,options:[`horizontal`,`vertical`]},appearance:{control:`select`,options:[`segmented`,`outline`,`swatches`]},fullWidth:{control:`boolean`}}},l={},u={args:{appearance:`outline`}},d={args:{orientation:`vertical`}},f={args:{disabled:!0}},p={args:{label:`Accent color`,appearance:`swatches`,options:[{value:`list`,label:`Blue ink`,swatchColor:`var(--wm-color-accent)`},{value:`board`,label:`Green ink`,swatchColor:`var(--wm-color-success)`}]}},m=[`Playground`,`Outline`,`Vertical`,`Disabled`,`Swatches`],l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    appearance: "outline"
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    orientation: "vertical"
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    disabled: true
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    label: "Accent color",
    appearance: "swatches",
    options: [{
      value: "list",
      label: "Blue ink",
      swatchColor: "var(--wm-color-accent)"
    }, {
      value: "board",
      label: "Green ink",
      swatchColor: "var(--wm-color-success)"
    }]
  }
}`,...p.parameters?.docs?.source}}}})))()}h();export{f as Disabled,u as Outline,l as Playground,p as Swatches,d as Vertical,m as __namedExportsOrder,c as default};