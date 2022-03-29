import React, { useEffect, useState } from 'react'
import twitterLogo from './assets/twitter-logo.svg'
import './App.css'
import SelectCharacter from './Components/SelectCharacter'
import { CONTRACT_ADDRESS, transformCharacterData } from './constants'
import { ethers } from 'ethers'
import myEpicGame from './utils/MyEpicGame.json'
import Arena from './Components/Arena'
import LoadingIndicator from './Components/LoadingIndicator'

// Constants
const TWITTER_HANDLE = 'junya_tad'
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`

const App = () => {
  const [currentAccount, setCurrentAccount] = useState(null)
  const [characterNFT, setCharacterNFT] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  // Rinkeby Networkに接続されているか確認
  const checkNetwork = async () => {
    try {
      if (window.ethereum.networkVersion !== '4') {
        alert('Rinkeby Test Network に接続してください')
      } else {
        console.log('Rinkeby に接続されています.')
      }
    } catch (error) {
      console.log(error)
    }
  }

  // ユーザーがMetaMaskを持っているか確認
  const checkIfWalletsConnected = async () => {
    try {
      const { ethereum } = window
      if (!ethereum) {
        console.log('Make sure you have MetaMask!')

        setIsLoading(false)
        return
      } else {
        console.log('We have the ethereum object', ethereum)
        // accountsにWEBサイトを訪れたユーザーのウォレットアカウントを格納
        //複数持っている場合も加味、よってaccount's'
        const accounts = await ethereum.request({ method: 'eth_accounts' })
        // もしアカウントが一つでも存在したら
        if (accounts !== 0) {
          // accountsという変数にユーザーの1つ目のアドレスを格納
          const account = accounts[0]
          console.log('Found an authorized account:', account)
          // currentAccountに格納
          setCurrentAccount(account)
          checkNetwork()
        } else {
          console.log('No authorized account found')
        }
      }
    } catch (error) {
      console.log(error)
    }
    // 全ての関数ロジック後stateプロパティを解放
    setIsLoading(false)
  }

  // レンダリングメソッド
  const renderContent = () => {
    if (isLoading) {
      return <LoadingIndicator />
    }
    // シナリオ1.
    // ユーザーがWEBアプリにログインしていない場合
    if (!currentAccount) {
      return (
        <div className='connect-wallet-container'>
          <img src='https://i.imgur.com/TXBQ4cC.png' alt='LUFFY' />
          <button
            className='cta-button connect-wallet-button'
            onClick={connectWalletAction}
          >
            Connect Wallet to Get Started
          </button>
        </div>
      )
      // シナリオ2.
      // ユーザーはWEBアプリにログインしており、かつNFTキャラクターを持っていいない場合
    } else if (currentAccount && !characterNFT) {
      return <SelectCharacter setCharacterNFT={setCharacterNFT} />
      // シナリオ3.
      // ユーザーはWEBアプリにログインしており、かつNFTキャラクターを持っている場合
    } else if (currentAccount && characterNFT) {
      return (
        <Arena characterNFT={characterNFT} setCharacterNFT={setCharacterNFT} />
      )
    }
  }

  // connectWalletActionメソッドを実装
  const connectWalletAction = async () => {
    try {
      const { ethereum } = window
      if (!ethereum) {
        alert('MetaMaskをダウンロードしてください!')
        return
      }
      checkIfWalletsConnected()
      // ウォレットアドレスに対しアクセスをリクエスト
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      })
      // ウォレットアドレスをcurrentAccountに紐づけ
      console.log('Connected', accounts[0])
      setCurrentAccount(accounts[0])

      checkNetwork()
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    setIsLoading(true)
    checkIfWalletsConnected()
  }, [])

  useEffect(() => {
    // スマートコントラクトを呼び出す
    const fetchNFTMetadata = async () => {
      console.log('Checking for Character NFT on address:', currentAccount)

      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const gameContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        myEpicGame.abi,
        signer
      )

      const txn = await gameContract.checkIfUserHasNFT()
      if (txn.name) {
        console.log('User has charater NFT')
        setCharacterNFT(transformCharacterData(txn))
      } else {
        console.log('No character NFT found')
      }
    }

    // 接続されたウォレットがある場合のみ下記を事項
    if (currentAccount) {
      console.log('CurrentAccount:', currentAccount)
      fetchNFTMetadata()
    }
    setIsLoading(false)
  }, [currentAccount])

  return (
    <div className='App'>
      <div className='container'>
        <div className='header-container'>
          <p className='header gradient-text'>⚡️ METAVERSE GAME ⚡️</p>
          <p className='sub-text'>プレイヤーと協力してボスを倒そう✨</p>
          {renderContent()}
        </div>
        <div className='footer-container'>
          <img alt='Twitter Logo' className='twitter-logo' src={twitterLogo} />
          <a
            className='footer-text'
            href={TWITTER_LINK}
            target='_blank'
            rel='noreferrer'
          >{`built with @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  )
}

export default App
