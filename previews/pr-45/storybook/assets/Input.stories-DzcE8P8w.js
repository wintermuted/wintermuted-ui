import{n as e}from"./rolldown-runtime-sJBDdmOt.js";import{n as t,y as n}from"./iframe-CpC3fxPU.js";import{n as r,t as i}from"./Input-BDNosUHX.js";function a(e){let t=(0,o.useId)(),[,n]=c();return(0,s.jsxs)(`div`,{className:`wm-storybook-field`,children:[(0,s.jsx)(`label`,{htmlFor:t,children:`Project name`}),(0,s.jsx)(i,{...e,id:t,onChange:t=>{n({value:t.currentTarget.value}),e.onChange?.(t)}})]})}var o,s,c,l,u,d,f,p,m;function h(){return(h=e((()=>{o=n(),r(),s=t(),{useArgs:c}=__STORYBOOK_MODULE_PREVIEW_API__,{fn:l}=__STORYBOOK_MODULE_TEST__,u={title:`Components/Forms/Input`,id:`components-input`,render:a,args:{value:``,placeholder:`e.g. Wintermuted`,disabled:!1,onChange:l()},argTypes:{value:{control:`text`,description:`Controlled input value; typing also updates Controls.`},placeholder:{control:`text`},disabled:{control:`boolean`}},parameters:{docs:{description:{component:`A native input styled with the theme. The example adds an associated label and keeps its value synchronized with Controls.`}}}},d={},f={args:{value:`Wintermuted UI`}},p={args:{value:`Read-only example`,disabled:!0}},m=[`Playground`,`Filled`,`Disabled`],d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    value: "Wintermuted UI"
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    value: "Read-only example",
    disabled: true
  }
}`,...p.parameters?.docs?.source}}}})))()}h();export{p as Disabled,f as Filled,d as Playground,m as __namedExportsOrder,u as default};