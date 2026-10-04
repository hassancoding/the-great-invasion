'use client';

import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

type Soldier={mesh:THREE.Group;team:'friendly'|'enemy';hp:number;timer:number};

export default function Game3D(){
 const ref=useRef<HTMLDivElement>(null);
 const [started,setStarted]=useState(false);
 const [health,setHealth]=useState(100);
 const [ammo,setAmmo]=useState(30);
 const [enemyCount,setEnemyCount]=useState(12);
 const [capture,setCapture]=useState(0);
 useEffect(()=>{
  if(!started||!ref.current)return;
  let dead=false,raf=0;
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x718080);
  scene.fog=new THREE.FogExp2(0x718080,.012);
  const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,700);
  camera.position.set(0,3,10);
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
  renderer.shadowMap.enabled=true;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.domElement.className='game-canvas';ref.current.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xc9d8d8,0x283027,2));
  const sun=new THREE.DirectionalLight(0xffe0a4,3.2);sun.position.set(-80,120,50);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);scene.add(sun);
  const physics=new RAPIER.World({x:0,y:-18,z:0});
  const floor=physics.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  physics.createCollider(RAPIER.ColliderDesc.cuboid(140,1,140).setTranslation(0,-1,0),floor);
  const terrain=new THREE.Mesh(new THREE.PlaneGeometry(280,280,64,64),new THREE.MeshStandardMaterial({color:0x536052,roughness:1}));
  terrain.rotation.x=-Math.PI/2;
  const a=terrain.geometry.attributes.position;
  for(let i=0;i<a.count;i++){const x=a.getX(i),z=a.getY(i);a.setZ(i,Math.sin(x*.045)*2.5+Math.cos(z*.04)*2+Math.sin((x+z)*.07));}
  terrain.geometry.computeVertexNormals();terrain.receiveShadow=true;scene.add(terrain);
  const roadMat=new THREE.MeshStandardMaterial({color:0x393a36,roughness:1});
  for(const [x,z,w,d] of [[0,0,18,250],[45,-25,11,150],[-45,35,10,130]] as number[][]){const r=new THREE.Mesh(new THREE.BoxGeometry(w,.12,d),roadMat);r.position.set(x,.05,z);scene.add(r);}
  const makeBuilding=(x:number,z:number,w:number,d:number,h:number)=>{
   const g=new THREE.Group();const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:0x595852,roughness:.9}));m.position.y=h/2;m.castShadow=true;m.receiveShadow=true;g.add(m);
   const roof=new THREE.Mesh(new THREE.BoxGeometry(w+1,.5,d+1),new THREE.MeshStandardMaterial({color:0x292d2b}));roof.position.y=h+.25;g.add(roof);g.position.set(x,0,z);scene.add(g);
  };
  makeBuilding(40,-62,16,11,8);makeBuilding(50,-48,9,8,6);makeBuilding(-40,36,13,10,7);makeBuilding(-56,52,10,8,5);
  const tower=new THREE.Group();const base=new THREE.Mesh(new THREE.CylinderGeometry(2.5,3,1,12),new THREE.MeshStandardMaterial({color:0x4a514b}));base.position.y=.5;tower.add(base);
  const mast=new THREE.Mesh(new THREE.CylinderGeometry(.22,.4,12,8),new THREE.MeshStandardMaterial({color:0x303634,metalness:.5}));mast.position.y=6;tower.add(mast);tower.position.set(40,0,-62);scene.add(tower);
  const trunk=new THREE.MeshStandardMaterial({color:0x473729}),leaf=new THREE.MeshStandardMaterial({color:0x2e4b37});
  for(let i=0;i<100;i++){const t=new THREE.Group();const b=new THREE.Mesh(new THREE.CylinderGeometry(.12,.2,2.5,6),trunk);b.position.y=1.25;t.add(b);const c=new THREE.Mesh(new THREE.ConeGeometry(1.6,4.2,7),leaf);c.position.y=4;t.add(c);const ang=i*2.4,r=48+(i%8)*7;t.position.set(Math.cos(ang)*r,0,Math.sin(ang)*r);t.scale.setScalar(.7+(i%5)*.08);t.traverse(o=>{if((o as THREE.Mesh).isMesh)o.castShadow=true});scene.add(t);}
  const soldiers:Soldier[]=[];
  const soldier=(team:'friendly'|'enemy',x:number,z:number)=>{
   const g=new THREE.Group();const mat=new THREE.MeshStandardMaterial({color:team==='friendly'?0x718d5b:0x9a4d43,roughness:.8});
   const body=new THREE.Mesh(new THREE.CapsuleGeometry(.45,1.1,4,8),mat);body.position.y=1.35;body.castShadow=true;g.add(body);
   const head=new THREE.Mesh(new THREE.SphereGeometry(.3,12,8),mat);head.position.y=2.25;head.castShadow=true;g.add(head);
   const pack=new THREE.Mesh(new THREE.BoxGeometry(.65,.75,.28),new THREE.MeshStandardMaterial({color:0x313933}));pack.position.set(0,1.45,-.4);g.add(pack);
   g.position.set(x,0,z);scene.add(g);soldiers.push({mesh:g,team,hp:100,timer:Math.random()*2});
  };
  for(let i=0;i<6;i++)soldier('friendly',-10+i*3,28+(i%2)*3);
  for(let i=0;i<6;i++)soldier('friendly',-14+i*3,39+(i%2)*3);
  for(let i=0;i<12;i++)soldier('enemy',26+(i%4)*4,-20-Math.floor(i/4)*7);
  const keys=new Set<string>(),vel=new THREE.Vector3();let yaw=0,pitch=0,cd=0,capt=0;
  const onKey=(e:KeyboardEvent)=>{keys.add(e.code);if(e.code==='KeyR'){setAmmo(30);}};const off=(e:KeyboardEvent)=>keys.delete(e.code);
  const onMove=(e:MouseEvent)=>{if(document.pointerLockElement===renderer.domElement){yaw-=e.movementX*.0022;pitch=THREE.MathUtils.clamp(pitch-e.movementY*.0018,-1.2,1.1);}};
  const shoot=()=>{if(cd>0||ammo<=0)return;cd=.13;setAmmo(v=>Math.max(0,v-1));const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(0,0),camera);const hits=ray.intersectObjects(soldiers.filter(s=>s.team==='enemy'&&s.hp>0).map(s=>s.mesh),true);if(hits[0]){let o:any=hits[0].object;while(o&& !soldiers.some(s=>s.mesh===o))o=o.parent;const s=soldiers.find(s=>s.mesh===o);if(s){s.hp-=34;if(s.hp<=0)scene.remove(s.mesh);setEnemyCount(soldiers.filter(s=>s.team==='enemy'&&s.hp>0).length);}}};
  const click=()=>{if(document.pointerLockElement!==renderer.domElement)renderer.domElement.requestPointerLock();else shoot();};
  addEventListener('keydown',onKey);addEventListener('keyup',off);renderer.domElement.addEventListener('mousemove',onMove);renderer.domElement.addEventListener('click',click);
  const clock=new THREE.Clock();
  const loop=()=>{if(dead)return;const dt=Math.min(clock.getDelta(),.05);physics.step();cd=Math.max(0,cd-dt);
   vel.set(0,0,0);const f=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw)),r=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));if(keys.has('KeyW'))vel.add(f);if(keys.has('KeyS'))vel.sub(f);if(keys.has('KeyA'))vel.sub(r);if(keys.has('KeyD'))vel.add(r);if(vel.lengthSq())vel.normalize().multiplyScalar(keys.has('ShiftLeft')?11:5.5);
   camera.position.x+=vel.x*dt;camera.position.z+=vel.z*dt;camera.position.y=2.7;camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0);
   const pp=new THREE.Vector3(camera.position.x,0,camera.position.z);
   for(const s of soldiers){if(s.hp<=0)continue;const p=s.mesh.position;s.timer-=dt;const d=p.distanceTo(pp);if(s.team==='enemy'){if(d<40){const q=pp.clone().sub(p);q.y=0;if(q.length()>11){q.normalize();p.addScaledVector(q,dt*1.5)}s.mesh.rotation.y=Math.atan2(q.x,q.z);if(d<30&&s.timer<=0){s.timer=1.4;setHealth(v=>Math.max(0,v-3));}}else{s.mesh.position.x+=Math.sin(performance.now()/1800+s.mesh.id)*dt*.45;}}else{const q=pp.clone().sub(p);q.y=0;if(q.length()>5){q.normalize();p.addScaledVector(q,dt*1.8);s.mesh.rotation.y=Math.atan2(q.x,q.z);}}}
   const dist=pp.distanceTo(new THREE.Vector3(40,0,-62));capt=dist<14?Math.min(100,capt+dt*7):Math.max(0,capt-dt*2);setCapture(Math.round(capt));renderer.render(scene,camera);raf=requestAnimationFrame(loop);
  };loop();
  const resize=()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)};addEventListener('resize',resize);
  return()=>{dead=true;cancelAnimationFrame(raf);removeEventListener('keydown',onKey);removeEventListener('keyup',off);removeEventListener('resize',resize);renderer.domElement.removeEventListener('mousemove',onMove);renderer.domElement.removeEventListener('click',click);renderer.dispose();physics.free();ref.current?.replaceChildren();};
 },[started]);
 return <div className="game-shell"><div ref={ref}/>
 {!started&&<div className="menu"><div className="menu-card fade"><div className="logo-small">DATAFOG STUDIOS PRESENTS</div><div className="logo">THE GREAT<em>INVASION</em></div><p className="menu-sub">OPERATION IRON GATE · NORTHERN FRONTIER · 06:42<br/>Lead Alpha and Bravo squads through a living 3D battlefield and secure the communications facility.</p><button className="begin" onClick={()=>setStarted(true)}>BEGIN OPERATION</button><div className="menu-note">REAL-TIME 3D · AI UNITS · PHYSICS · TERRAIN · TACTICAL COMBAT</div></div></div>}
 {started&&<div className="hud"><div className="mission-card"><div className="mission-kicker">Operation Iron Gate</div><div className="mission-title">Hold The Line</div><p className="mission-copy">Push through the valley. Keep your squads moving. Capture the communications facility.</p><div className="objective"><div className="objective-label">Primary objective</div><div className="objective-text">SECURE THE COMMUNICATIONS FACILITY</div></div></div><div className="top-right"><div className="status-chip">ENEMY <span>{enemyCount}</span></div><div className="status-chip">ALPHA <span>6</span></div><div className="status-chip">BRAVO <span>6</span></div></div><div className="compass">N · 06:42 · OVERCAST<div className="compass-line"/></div><div className="crosshair"/><div className="bottom-left"><div className="health-row"><div className="health-value">{health}</div><div className="health-label">COMBAT CONDITION</div></div><div className="bar"><i style={{width:health+'%'}}/></div><div className="ammo"><div className="ammo-main">{ammo}<small> / 30</small></div><div className="weapon">SERVICE RIFLE · SEMI AUTO</div></div></div><div className="bottom-center"><div className="capture"><div className="capture-title">COMMUNICATIONS FACILITY · {capture}%</div><div className="capture-bar"><i style={{width:capture+'%'}}/></div></div></div><div className="squad-panel"><div className="eyebrow">FIELD COMMAND</div><div className="squad-row"><b>ALPHA</b><span>6/6 · FOLLOW</span></div><div className="squad-row"><b>BRAVO</b><span>6/6 · ADVANCE</span></div><div className="squad-row"><b>ORDERS</b><span>WASD · SPRINT</span></div></div><div className="controls">CLICK TO LOCK MOUSE · WASD MOVE · SHIFT SPRINT · R RELOAD · CLICK FIRE · ESC RELEASE</div></div>}
 </div>;
}