import styled from 'typed-emotion'

export const Root = styled.div`
  left: calc(40px + 16px + 19px);
  cursor: pointer;
  border-radius: 3px;
  margin-bottom: -16px;
  margin-top: 1.0625rem;
  margin-right: 120px;
  text-overflow: ellipsis;
  padding-bottom: 0;
  user-select: none;
  height: 16px;
  display: flex;
  align-items: center;
  position: relative;
  white-space: pre;

  &:before {
    content: '';
    display: block;
    position: absolute;
    box-sizing: border-box;
    top: 50%;
    right: 100%;
    bottom: 1px;
    left: calc(-1 * (0.5 * 40px + 16px));
    margin: calc(-0.5 * 2px) 4px calc(-4px + 0.125rem) calc(-0.5 * 2px);
    border-color: hsl(228 calc(1 * 6%) 32.5% / 1);
    border-width: 2px 0 0 2px;
    border-style: solid;
    border-top-left-radius: 6px;
    z-index: 9999;
    //position: absolute;
    //width: 33px;
    //height: 12px;
    //top: 9px;
    //left: 34px;
    //border-left: 2px solid rgb(79, 84, 92);
    //border-top: 2px solid rgb(79, 84, 92);
    //border-top-left-radius: 6px;
  }
`

export const ReplyText = styled.div`
  color: hsl(215 calc(1 * 8.8%) 73.3% / 1);
  text-overflow: ellipsis;
  overflow: hidden;
`

export const ReplyTextPreview = styled.div`
  color: hsl(215 calc(1 * 8.8%) 73.3% / 1);
  display: flex;
  text-overflow: ellipsis;
  flex: 0 1 auto;
  overflow: hidden;
`

export const RepliedTextContent = styled.div`
  color: inherit;
  overflow: hidden;
  font-size: 14px;
`
