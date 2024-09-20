import React, { useEffect, useRef } from 'react';
import { Engine, Scene, Vector3, HemisphericLight, MeshBuilder, StandardMaterial, Color3, ArcRotateCamera, KeyboardEventTypes, Animation } from '@babylonjs/core';
import { TextBlock,AdvancedDynamicTexture, Control, StackPanel } from '@babylonjs/gui';
import { ShadowsOfInfinity } from './GameGui';

const GameScene: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);

    // Camera
    const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 200, Vector3.Zero(), scene);
    camera.attachControl(canvasRef.current, true);

    // Light
    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

    // Target sphere (enemy ship)
    const targetSphere = MeshBuilder.CreateSphere("targetSphere", {diameter: 5}, scene);
    const targetSphereMaterial = new StandardMaterial("targetMaterial", scene);
    targetSphereMaterial.diffuseColor = new Color3(0, 1, 0);
    targetSphere.material = targetSphereMaterial;

    // Cube (player-controlled ship)
    const cube = MeshBuilder.CreateBox("cube", {size: 5}, scene);
    cube.position = new Vector3(-50, 0, 0);
    const cubeMaterial = new StandardMaterial("cubeMaterial", scene);
    cubeMaterial.diffuseColor = new Color3(1, 0, 0);
    cube.material = cubeMaterial;

    // Create projectile pool function
    const createProjectilePool = (color: Color3, count: number, size: number, isGlowy: boolean) => {
      return Array(count).fill(null).map(() => {
        const projectile = MeshBuilder.CreateSphere("projectile", {diameter: size}, scene);
        const projectileMaterial = new StandardMaterial("projectileMaterial", scene);
        projectileMaterial.diffuseColor = color;
        if (isGlowy) {
          projectileMaterial.emissiveColor = color;
          projectileMaterial.specularColor = color;
          projectileMaterial.ambientColor = color;
        }
        projectile.material = projectileMaterial;
        projectile.isVisible = false;
        return projectile;
      });
    };

    // Main projectiles (torpedoes)
    const playerProjectiles = createProjectilePool(new Color3(1, 1, 0), 20, 2, false);
    const targetProjectiles = createProjectilePool(new Color3(0, 0, 1), 20, 2, false);

    // PDC projectiles
    const playerPDProjectiles = createProjectilePool(new Color3(1, 0.5, 0), 100, 0.5, true);
    const targetPDProjectiles = createProjectilePool(new Color3(0, 0.5, 1), 100, 0.5, true);

    // Animation for target sphere
      // Animation for target sphere
    const targetAnimation = new Animation("targetAnimation", "position", 30, 
        Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
    targetAnimation.setKeys([
        { frame: 0, value: new Vector3(0, 0, 50) },
        { frame: 50, value: new Vector3(50, 0, -50) },
        { frame: 100, value: new Vector3(-50, 0, -50) },
        { frame: 150, value: new Vector3(0, 0, 50) }
    ]);
    scene.beginDirectAnimation(targetSphere, [targetAnimation], 0, 150, true);

    const expanseGUI = new ShadowsOfInfinity(scene);

    // Game state
    let playerHealth = 100;
    let enemyHealth = 100;
    let playerTorpedoes = 20;
    let enemyTorpedoes = 20;
    

    // Projectile logic
    const torpedoSpeed = 0.8;
    const pdProjectileSpeed = 2;
    const pdFireRate = 100; // ms

    class PDC {
      trackedProjectile: any = null;
      lastFireTime: number = 0;

      track(projectile: any) {
        if (!this.trackedProjectile) {
          this.trackedProjectile = projectile;
        }
      }

      update(source: any, pdProjectiles: any[], currentTime: number) {
        if (this.trackedProjectile && this.trackedProjectile.isVisible) {
          if (currentTime - this.lastFireTime > pdFireRate) {
            const inactiveProjectile = pdProjectiles.find(p => !p.isVisible);
            if (inactiveProjectile) {
              inactiveProjectile.position = source.position.clone();
              inactiveProjectile.isVisible = true;
              const direction = this.trackedProjectile.position.subtract(source.position).normalize();
              inactiveProjectile.direction = direction;
            }
            this.lastFireTime = currentTime;
          }
        } else {
          this.trackedProjectile = null;
        }
      }
    }

    const playerPDCs = [new PDC(), new PDC(), new PDC(), new PDC()];
    const targetPDCs = [new PDC(), new PDC(), new PDC(), new PDC()];

    const fireTorpedo = (projectiles: any[], source: any, target: any, torpedoCount: number) => {
      if (torpedoCount > 0) {
        const inactiveProjectiles = projectiles.filter(p => !p.isVisible).slice(0, 4);
        inactiveProjectiles.forEach(projectile => {
          projectile.position = source.position.clone();
          projectile.isVisible = true;
          projectile.target = target;
        });
        return torpedoCount - inactiveProjectiles.length;
      }
      return torpedoCount;
    };

    const updateProjectiles = (projectiles: any[], targets: any[], pdProjectiles: any[], isPlayerProjectile: boolean) => {
      projectiles.forEach(projectile => {
        if (projectile.isVisible) {
          const direction = projectile.target.position.subtract(projectile.position).normalize();
          projectile.position.addInPlace(direction.scale(torpedoSpeed));
          
          targets.forEach(target => {
            if (projectile.intersectsMesh(target, false)) {
              projectile.isVisible = false;
              if (isPlayerProjectile) {
                enemyHealth -= 10;
              } else {
                playerHealth -= 10;
              }
              console.log(target.name + " hit by torpedo!");
            }
          });

          pdProjectiles.forEach(pdProjectile => {
            if (pdProjectile.isVisible && projectile.intersectsMesh(pdProjectile, false)) {
              projectile.isVisible = false;
              pdProjectile.isVisible = false;
              if (isPlayerProjectile) {
                playerTorpedoes++;
              } else {
                enemyTorpedoes++;
              }
              console.log("Torpedo intercepted!");
            }
          });

          if (projectile.position.length() > 300) {
            projectile.isVisible = false;
          }
        }
      });
    };

    const updatePDProjectiles = (pdProjectiles: any[], target: any, isPlayerProjectile: boolean) => {
      pdProjectiles.forEach(projectile => {
        if (projectile.isVisible) {
          projectile.position.addInPlace(projectile.direction.scale(pdProjectileSpeed));
          if (projectile.intersectsMesh(target, false)) {
            projectile.isVisible = false;
            if (isPlayerProjectile) {
              enemyHealth -= 1;
            } else {
              playerHealth -= 1;
            }
          }
          if (projectile.position.length() > 300) {
            projectile.isVisible = false;
          }
        }
      });
    };

    let lastPlayerFireTime = 0;
    let lastEnemyFireTime = 0;
    const fireCooldown = 1000; // 1 second cooldown between torpedo volleys

    scene.onBeforeRenderObservable.add(() => {
      const currentTime = Date.now();

      // Player auto-fire
      if (currentTime - lastPlayerFireTime > fireCooldown && playerTorpedoes > 0) {
        playerTorpedoes = fireTorpedo(playerProjectiles, cube, targetSphere, playerTorpedoes);
        lastPlayerFireTime = currentTime;
      }

      // Enemy auto-fire
      if (currentTime - lastEnemyFireTime > fireCooldown && enemyTorpedoes > 0) {
        enemyTorpedoes = fireTorpedo(targetProjectiles, targetSphere, cube, enemyTorpedoes);
        lastEnemyFireTime = currentTime;
      }

      // Update PDCs
      playerPDCs.forEach(pdc => {
        if (!pdc.trackedProjectile) {
          const untracked = targetProjectiles.find(p => p.isVisible && !playerPDCs.some(otherPDC => otherPDC.trackedProjectile === p));
          if (untracked) pdc.track(untracked);
        }
        pdc.update(cube, playerPDProjectiles, currentTime);
      });

      targetPDCs.forEach(pdc => {
        if (!pdc.trackedProjectile) {
          const untracked = playerProjectiles.find(p => p.isVisible && !targetPDCs.some(otherPDC => otherPDC.trackedProjectile === p));
          if (untracked) pdc.track(untracked);
        }
        pdc.update(targetSphere, targetPDProjectiles, currentTime);
      });

      updateProjectiles(playerProjectiles, [targetSphere], targetPDProjectiles, true);
      updateProjectiles(targetProjectiles, [cube], playerPDProjectiles, false);
      updatePDProjectiles(playerPDProjectiles, targetSphere, true);
      updatePDProjectiles(targetPDProjectiles, cube, false);


      // Check for game over
      if (playerHealth <= 0 || enemyHealth <= 0) {
        console.log(playerHealth <= 0 ? "Game Over: Player Lost" : "Game Over: Player Won");
        scene.onBeforeRenderObservable.clear();
      }
    });

    // Player controls
    const moveSpeed = 0.5;
    const keys: { [key: string]: boolean } = {};

    scene.onKeyboardObservable.add((kbInfo) => {
        switch (kbInfo.type) {
            case KeyboardEventTypes.KEYDOWN:
                keys[kbInfo.event.key] = true;
                break;
            case KeyboardEventTypes.KEYUP:
                keys[kbInfo.event.key] = false;
                break;
        }
    });

    scene.onBeforeRenderObservable.add(() => {
        if (keys["ArrowUp"] || keys["w"]) cube.position.z += moveSpeed;
        if (keys["ArrowDown"] || keys["s"]) cube.position.z -= moveSpeed;
        if (keys["ArrowLeft"] || keys["a"]) cube.position.x -= moveSpeed;
        if (keys["ArrowRight"] || keys["d"]) cube.position.x += moveSpeed;
        
        // Keep player within bounds
        cube.position.x = Math.max(-100, Math.min(100, cube.position.x));
        cube.position.z = Math.max(-100, Math.min(100, cube.position.z));
    });

    engine.runRenderLoop(() => {
      scene.render();
    });

    const handleResize = () => {
      engine.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};

export default GameScene;