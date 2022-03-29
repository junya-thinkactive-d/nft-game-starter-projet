import { ethers } from 'ethers'
import React, { useEffect, useState } from 'react'
import { CONTRACT_ADDRESS, transformCharacterData } from '../../constants'
import myEpicGame from '../../utils/MyEpicGame.json'
import './Arena.css'
import LoadingIndicator from '../LoadingIndicator'

const Arena = ({ characterNFT, setCharacterNFT }) => {
  // コントラクトのデータを保有する状態変数を初期化
  const [gameContract, setGameContract] = useState(null)
  const [boss, setBoss] = useState(null)

  // 攻撃の状態を保存する変数を初期化
  const [attackState, setAttackState] = useState('')
  const [showToast, setShowToast] = useState(false)
  //ボスを攻撃する関数
  const runAttackAction = async () => {
    try {
      // コントラクトが呼び出されたことを確認
      if (gameContract) {
        // attackStateの状態をattackingに設定
        setAttackState('attacking')
        console.log('Attacking boss ...')

        // NFTキャラクターがボスを攻撃
        const attackTxn = await gameContract.attackBoss()

        // トランザクションがマイニングされるまで
        await attackTxn.wait()
        console.log('attackTxn', attackTxn)

        // attackStateの状態をhitに設定
        setAttackState('hit')
        // 攻撃のダメージ表示をtrue,5秒後false
        setShowToast(true)
        setTimeout(() => {
          setShowToast(false)
        }, 5000)
      }
    } catch (error) {
      console.error('Error attacking boss:', error)
      setAttackState('')
    }
  }

  useEffect(() => {
    const fetchBoss = async () => {
      const bossTxn = await gameContract.getBigBoss()
      console.log('Boss', bossTxn)
      setBoss(transformCharacterData(bossTxn))
    }

    // AttackCompleteイベントを受信したときに起動するコールバックメソッドを追加
    const onAttackComplete = (newBossHp, newPlayerHp) => {
      // ボスの新しいHP
      const bossHp = newBossHp.toNumber()
      // NFTの新しいHP
      const playerHp = newPlayerHp.toNumber()
      console.log(`AttackComplete: Boss Hp:${bossHp} Player Hp: ${playerHp}`)

      // NFTとボスのHPを更新
      setBoss((prevState) => {
        return { ...prevState, hp: bossHp }
      })
      setCharacterNFT((prevState) => {
        return { ...prevState, hp: playerHp }
      })
    }
    if (gameContract) {
      // コントラクトの準備ができたら、ボスのメタデータを取得
      fetchBoss()
      //リスナーの設定:ボスが攻撃された通知
      gameContract.on('AttackComplete', onAttackComplete)
    }
    return () => {
      if (gameContract) {
        gameContract.off('AttackComplete', onAttackComplete)
      }
    }
  }, [gameContract])

  useEffect(() => {
    const { ethereum } = window
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum)
      const signer = provider.getSigner()
      const gameContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        myEpicGame.abi,
        signer
      )
      setGameContract(gameContract)
    } else {
      console.log('Ethereum object not found')
    }
  }, [])
  return (
    <div className='arena-container'>
      {/* 攻撃ダメージの通知を追加 */}
      {boss && characterNFT && (
        <div id='toast' className={showToast ? 'show' : ''}>
          <div id='desc'>{`💥 ${boss.name} was hit for ${characterNFT.attackDamage}!`}</div>
        </div>
      )}
      {/* ボスをレンダリング */}
      {boss && (
        <div className='boss-container'>
          <div className={`boss-content  ${attackState}`}>
            <h2>🔥 {boss.name} 🔥</h2>
            <div className='image-content'>
              <img src={`https://cloudflare-ipfs.com/ipfs/${boss.imageURI}`} alt={`Boss ${boss.name}`} />
              <div className='health-bar'>
                <progress value={boss.hp} max={boss.maxHp} />
                <p>{`${boss.hp} / ${boss.maxHp} HP`}</p>
              </div>
            </div>
          </div>
          <div className='attack-container'>
            <button className='cta-button' onClick={runAttackAction}>
              {`💥 Attack ${boss.name}`}
            </button>
          </div>
          {/* Attack ボタンの下にローディングマークを追加*/}
          {attackState === 'attacking' && (
            <div className='loading-indicator'>
              <LoadingIndicator />
              <p>Attacking ⚔️</p>
            </div>
          )}
        </div>
      )}
      {/* NFTキャラクターをレンダリング*/}
      {characterNFT && (
        <div className='players-container'>
          <div className='player-container'>
            <h2>Your Character</h2>
            <div className='player'>
              <div className='image-content'>
                <h2>{characterNFT.name}</h2>
                <img
                  src={`https://cloudflare-ipfs.com/ipfs/${characterNFT.imageURI}`}
                  alt={`Character ${characterNFT.name}`}
                />
                <div className='health-bar'>
                  <progress value={characterNFT.hp} max={characterNFT.maxHp} />
                  <p>{`${characterNFT.hp} / ${characterNFT.maxHp} HP`}</p>
                </div>
              </div>
              <div className='stats'>
                <h4>{`⚔️ Attack Damage: ${characterNFT.attackDamage}`}</h4>
              </div>
            </div>
          </div>
          {/* <div className="active-players">
          <h2>Active Players</h2>
          <div className="players-list">{renderActivePlayersList()}</div>
        </div> */}
        </div>
      )}
    </div>
  )
}

export default Arena
