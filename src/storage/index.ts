/**
 * 저장/불러오기 시스템
 *
 * IndexedDB 기반 게임 저장/불러오기 기능을 제공합니다.
 */

// 확장 모듈 먼저 임포트 (프로토타입 확장)
import './ManagerExtensions';

// 타입 내보내기
export * from './types';

// StorageManager 내보내기
export { StorageManager } from './StorageManager';

// 직렬화 함수 내보내기
export {
  serializeGenome,
  deserializeGenome,
  serializeOrganism,
  deserializeOrganism,
  serializeFood,
  deserializeFood,
} from './serialization';

// 게임 직렬화 함수 내보내기
export {
  serializeGame,
  deserializeGame,
} from './GameSerialization';
