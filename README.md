<br>

# **향해99 2기 | 실전 프로젝트 [협업돼지]**

<div align="center">
  <a href="https://teampig.co.kr"><img src="https://i.ibb.co/gSrjxmS/image.jpg"/> 클릭 시 실제 서비스 페이지로 이동합니다.</a>
</div>
<br>

![](https://i.ibb.co/SK9nnG1/image.png)
![](https://i.ibb.co/GWd3sRD/image.png)
![](https://i.ibb.co/SNTMstV/Frame-741.png)

<br>
<br>

## **목차 | Contents**

1. [협업돼지 서비스 소개](#협업돼지-서비스-소개)
2. [프로젝트 공동 행동강령](#프로젝트-공동-행동강령)
3. [팀원소개](#팀원소개)
4. [Git 운영 전략](#Git-운영-전략)
5. [주요 라이브러리](#주요-라이브러리)
6. [Architecture](#Architecture)
7. [ERD](#ERD)

<br>

<hr>

## **🐷 협업돼지 서비스 소개**

- **문서 작성 따로, 일정관리 따로, 메신저 따로... 따로.따로.따로😣<br>협업에 불편함을 느껴본 적 있으시죠?<br>**
- **저희는 이런 불편을 없애기 위해 하나의 서비스에서 협업에 관련된 모든 것을 한번에 진행할 수 있도록 하자는 공동의 목표로 탄생했습니다.**

<br>
<br>

## **🐱‍🏍 프로젝트 공동 행동강령**

✔ 서비스의 모든 것은 최대한 유저의 입장을 생각하여 설계한다.<br>
✔ 유저에게 불편을 줄만한 요소를 최대한 제거한다.<br>
✔ 사소한 기능일지라도 유저가 편리하다고 느낀다면 추가한다.<br>
✔ 공동의 목표인 완성도 높은 서비스를 위해 서로 배려하고 최대한 밝은 분위기로 소통한다.<br>
✔ 새로운 기술이 좋다고 무조건 쓰기 보다 기술을 도입할 때는 항상 이유를 생각하며 사용한다.<br>

<br>

## **🏊 팀원소개**

#### [팀노션페이지](https://www.notion.so/b0bdcefd9ab440afa5bc8565e45a71d8)

#### BackEnd (Node.js) - [Backend Github](https://github.com/team-pig/pig-backend)

- 이현수(팀장) (https://github.com/onanalee)
- 명재국 (https://github.com/awrde)
- 김동현 (https://github.com/donghyun1500)

#### Frontend (React) - [Frontend Github](https://github.com/team-pig/pig-frontend)

- 예상기 (https://github.com/with-key)
- 안지현 (https://github.com/jihyunan-dev)
- 김아영 (https://github.com/slamdunk11)

#### Design (UI/UX) - [Figma WireFrame](https://www.figma.com/file/0C63JnrDTaEF2GHQEF2qKx/TeamPig?node-id=0%3A1)

- Anna
- 정서윤

<br>

<!-- <!--  -->

## **🏄‍♀️ Git 운영 전략**

![](https://i.ibb.co/QnpSrt4/git.png)

```
main  : 테스트 서버에서 모든 테스트를 마친 성공적으로 작동되는 경우 실제 운영중인 본 서버로 바로 적용되는 브랜치
develop : 본 서버에 적용 전 테스트를 위한 브랜치
Room, User, Document...기타 등등 : develop에서 파생되어 각자 기능 별로 작업 중인 브랜치
```

<!-- <!-- <br> -->
<br>

## **주요 라이브러리 | Main Library**

- **Node.js**
- **Express**
- **redis**
- **socket.io**
- **MongoDB**

<details>
<summary> jsonwebtoken </summary>
유저 회원가입 이후 로그인시 사용되는 토큰
<br>
</details>

<details>
<summary> bcrypt </summary>
회원가입시 패스워드를 암호화하는 모듈
<br>
</details>

<details>
<summary> joi </summary>
회원가입시 User schema의 유효성을 검사하는 모듈 
<br>
</details>

<details>
<summary> uuid {v4} </summary>
방 초대코드 생성 및 비밀번호 재설정 이메일 인증을 위한 인스턴스 토큰 
<br>
</details>

<details>
<summary> nodemailer </summary>
비밀번호 재설정 시 유저 이메일 인증용
<br>
</details>

<details>
<summary> mongoose </summary>
프로젝션을 통해 클라이언트가 원하는 값만 전달, 
임베디드 형태와 수동 참조 방식을 주로 사용
<br>
</details>

<details>
<summary> dotenv </summary>
MongoDB Id, Password 정보, gmail 계정 정보, access token 및 refresh token 시크릿 키 정보 관리
<br>
</details>

<details>
<summary> cors </summary>
특정 도메인 요청 활성화
<br>
</details>

<details>
<summary> lodash </summary>
쉬운 deep copy를 위한 사용
<br>
</details>

<br>
<br>

## **📊 Architecture**

![](https://i.ibb.co/M1G0Q7R/Group-242.png)

<br>
<br>

## **🕸 ERD**

![mysql edr](https://i.ibb.co/LgFxJx7/my-new-app-Dra-1.png)
