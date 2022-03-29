import React, { useEffect, useState } from 'react'
import './SelectCharacter.css'
import { ethers } from 'ethers'
import { CONTRACT_ADDRESS, transformCharacterData } from '../../constants'
import myEpicGame from '../../utils/MyEpicGame.json'
import LoadingIndicator from '../../Components/LoadingIndicator'

const SelectCharacter = ({ setCharacterNFT }) => {
  const [characters, setCharacters] = useState([])
  const [gameContract, setGameContract] = useState(null)
  const [mintingCharacter, setMintingCharacter] = useState(false)

  const mintCharacterNFTAction = (characterId) => async () => {
    try {
      if (gameContract) {
        // Mintが開始されたら、ローディングマーク表示
        setMintingCharacter(true)

        console.log('Minting character in progress...')
        const mintTxn = await gameContract.mintCharacterNFT(characterId)
        await mintTxn.wait()
        console.log('mintTxn:', mintTxn)
        // Mintが終了したら、ローディングマーク非表示
        setMintingCharacter(false)
      }
    } catch (error) {
      console.warn('MintCharacterAction Error:', error)
      // エラーが発生した場合もローディングマーク非表示
      setMintingCharacter(false)
    }
  }

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

      // gameContractの状態を更新
      setGameContract(gameContract)
    } else {
      console.log('Ethereum object not found')
    }
  }, [])

  useEffect(() => {
    // NFTキャラクターのデータをスマートコントラクトから取得
    const getCharacters = async () => {
      try {
        console.log('Getting contract characters to mint')
        // ミント可能な全NFTキャラクターをコントラクトから呼び出し
        const charactersTxn = await gameContract.getAllDefaultCharacters()
        console.log('charactersTxn', charactersTxn)

        // 全てのNFTキャラクターのデータを変換
        const characters = charactersTxn.map((characterData) =>
          transformCharacterData(characterData)
        )

        setCharacters(characters)
      } catch (error) {
        console.error('Something went wrong fetching characters:', error)
      }
    }

    // イベントを受信したときに起動するコールバックメソッドonCharacterMintを追加
    const onCharacterMint = async (sender, tokenId, characterIndex) => {
      console.log(
        `CharacterNFTMinted - sender: ${sender} tokenId:${tokenId.toNumber()} characterIndex:${characterIndex.toNumber()}`
      )
      // NFTキャラクターがMintされたら、コントラクトからメタデータを受け取り、アリーナ（ボスとのバトルフィールド）に移動するための状態に設定
      if (gameContract) {
        const characterNFT = await gameContract.checkIfUserHasNFT()
        console.log('CharacterNFT: ', characterNFT)
        setCharacterNFT(transformCharacterData(characterNFT))
        alert(
          `NFTキャラクターがMintされました--リンクはこちらです: https://rinkiby.rarible.com/token/${
            gameContract.address
          }:${tokenId.toNumber()}?tab=details`
        )
      }
    }
    // gameContractの準備ができたら、NFTキャラクターを読み込み
    if (gameContract) {
      getCharacters()
      // リスナーの設定:NFTキャラクターがMintされた通知
      gameContract.on('CharacterNFTMinted', onCharacterMint)
    }
    return () => {
      // コンポーネントがマウントされたら、リスナーを停止
      if (gameContract) {
        gameContract.off('CharacterNFTMinted', onCharacterMint)
      }
    }
  }, [gameContract])
  // NFTキャラクターをフロントエンドにレンダリング
  const renderCharacters = () =>
    characters.map((character, index) => (
      <div className='character-item' key={character.name}>
        <div className='name-container'>
          <p>{character.name}</p>
        </div>
        <img src={`https://cloudflare-ipfs.com/ipfs/${character.imageURI}`} alt={character.name}/>
        <button
          type='button'
          className='character-mint-button'
          onClick={mintCharacterNFTAction(index)}
        >{`Mint ${character.name}`}</button>
      </div>
    ))
  return (
    <div className='select-character-container'>
      <h2>⏬ 一緒に戦う NFT キャラクターを選択 ⏬</h2>
      {characters.length > 0 && (
        <div className='character-grid'>{renderCharacters()}</div>
      )}
      {/* mintingCharacter = trueの場合のみ、ローディングマークを表示します。*/}
      {mintingCharacter && (
        <div className='loading'>
          <div className='indicator'>
            <LoadingIndicator />
            <p>Minting In Progress...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default SelectCharacter
